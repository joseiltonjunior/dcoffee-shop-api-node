import { FastifyRequest, FastifyReply } from 'fastify'

import { z } from 'zod'

import { makeFetchOrdersUseCase } from '@/use-cases/factories/make-fetch-orders-use-case'
import { ResourceNotFoundError } from '@/use-cases/errors/resource-not-found-error'

import { makeFetchProductsUseCase } from '@/use-cases/factories/make-fetch-products-use-case'
import { makeFetchUserProfileUseCase } from '@/use-cases/factories/make-fetch-user-profile-use-case'
import { UserNotExistsError } from '@/use-cases/errors/user-not-exists'
import { Order } from '@prisma/client'

export async function fetchOrders(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const fetchOrdersBodySchema = z.object({
    page: z.string(),
  })

  const { page } = fetchOrdersBodySchema.parse(request.query)

  try {
    const fetchOrdersUseCase = makeFetchOrdersUseCase()
    const fetchProductdUseCase = makeFetchProductsUseCase()
    const fetchUserProfileUseCase = makeFetchUserProfileUseCase()

    await fetchUserProfileUseCase.execute({
      id: request.user.sub,
    })

    const { currentPage, orders, totalItems, totalPages } =
      await fetchOrdersUseCase.execute({
        clientId: request.user.sub,
        page: Number(page),
      })

    const ordersWithProducts = await Promise.all(
      orders.map(async (order: Order) => {
        const products = await fetchProductdUseCase.execute({
          orderId: order.id,
        })

        const format = {
          ...order,
          ...products,
        }

        return format
      }),
    )

    return reply.status(200).send({
      orders: ordersWithProducts,
      currentPage,
      totalItems,
      totalPages,
    })
  } catch (err) {
    if (err instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: err.message })
    }

    if (err instanceof UserNotExistsError) {
      return reply.status(404).send({ message: err.message })
    }

    throw err
  }
}
