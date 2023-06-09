import { Prisma, Product } from '@prisma/client'
import { ProductRepository } from '../products-repository'

export class InMemoryProductsRepository implements ProductRepository {
  public items: Product[] = []

  async findManyProductsByOrderId(orderId: number): Promise<Product[] | null> {
    const products = this.items.filter(
      (product) => product.order_id === orderId,
    )

    if (!products) {
      return null
    }

    return products
  }

  async create(data: Prisma.ProductUncheckedCreateInput): Promise<Product> {
    const product = {
      id: 1,
      price_id: data.price_id,
      created_at: new Date(),
      img_url: data.img_url,
      order_id: data.order_id,
      quantity: data.quantity,
    }

    this.items.push(product)

    return product
  }
}
