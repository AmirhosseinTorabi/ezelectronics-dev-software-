const EXISTING_REVIEW = "You have already reviewed this product"
const NO_REVIEW = "You have not reviewed this product"

class ExistingReviewError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = EXISTING_REVIEW
        this.customCode = 409
    }
}

class NoReviewProductError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = NO_REVIEW
        this.customCode = 404
    }
}

class GenericReviewError extends Error {
    customMessage: string
    customCode: number

    constructor(genericErrorStr: string) {
        super()
        this.customMessage = genericErrorStr
        this.customCode = 415
    }
}

export { ExistingReviewError, NoReviewProductError, GenericReviewError }