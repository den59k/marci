export class HTTPError extends Error {
  statusCode: number
  isJSON = false
  override message: string
  constructor(message: string, statusCode?: number) {
    super()
    this.message = message
    this.statusCode = statusCode ?? 400
  }
}
