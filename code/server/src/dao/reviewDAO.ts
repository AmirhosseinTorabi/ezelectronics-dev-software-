import db from "../db/db";
import {
  ExistingReviewError,
  NoReviewProductError,
  GenericReviewError
} from "../errors/reviewError";
import { ProductNotFoundError } from "../errors/productError"
import { ProductReview } from "../components/review";

class ReviewDAO {
  addReview(
    model: string,
    username: string,
    score: number,
    date: string,
    comment: string
  ): Promise<void> {
    return new Promise<void>( (resolve, reject) => {
      try {        
        // Check if the product exists before attempting to delete it
        const checkProductPresent =
          "SELECT model FROM product WHERE model = ?";
        db.get(
          checkProductPresent,
          [model],
          async (err: Error | null, row: any) => {
            if (err) {
              reject(err);
              return;
            }

            if (!row) {
              reject(new ProductNotFoundError()); // No product found
              return;
            }

            //make sure there is no review for the product and that customer:
            const checkNotExistingReview = "SELECT model, username, score, date, comment FROM review WHERE model=? AND username=?"
            db.get(
              checkNotExistingReview,
              [model, username],
              async (err: Error | null, row: any) => {
                if (err) {
                  reject(err);
                  return;
                }
    
                if (row) {
                  reject(new ExistingReviewError()); // review existing
                  return;
                }  
                
                const insertReview = "INSERT INTO review (model, username, score, date, comment) VALUES(?, ?, ?, ?, ?)"
                db.run(insertReview, [model, username, score, date, comment], (err: Error | null) => {
                    if (err) {
                        if (err.message.includes("UNIQUE constraint failed: review.model")) reject(new ExistingReviewError)
                        reject(err)
                      return;
                    }
                    resolve()
                })
            })

      })
    } catch (error) {
        reject(error)
    }
    });
  }

  async getProductReviews(model: string): Promise<ProductReview[]> {
    return new Promise<ProductReview[]>(async (resolve, reject) => {
      try {
        // Retrieve all reviews for the given product model from the database
        const checkProductExists =
          "SELECT model FROM product WHERE model = ?";
        db.get(
          checkProductExists,
          [model],
          async (err: Error | null, row: any) => {
            if (err) {
              reject(err);
              return;
            }

            if (!row) {
              reject(new ProductNotFoundError()); // No product found
              return;
            }
            const getReviewsQuery = "SELECT model, username, score, date, comment FROM review WHERE model = ?";
            db.all(
          getReviewsQuery,
          [model],
          async (err: Error | null, rows: any[]) => {
            if (err) {
              reject(err);
              return;
            }
            const reviews = rows.map(
              (row) =>
                new ProductReview(
                  row.model,
                  row.username,
                  row.score,
                  row.date,
                  row.comment,
                )
            );
            resolve(reviews); // Reviews fetched successfully
          }
        );
          }
          )
      } catch (error) {
        reject(error);
      }
    });
  }

  async deleteReview(model: string, username: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        
        // Check if the product exists before attempting to delete it
        const checkProductExists =
          "SELECT model FROM product WHERE model = ?";
        db.get(
          checkProductExists,
          [model],
          async (err: Error | null, row: any) => {
            if (err) {
              reject(err);
              return;
            }

            if (!row) {
              reject(new ProductNotFoundError()); // No product found
              return;
            }
            //check if the user has a review
            const checkReviewExists = "SELECT model, username, score, date, comment FROM review WHERE model= ? AND username=?"
            db.get(
              checkReviewExists,
              [model, username],
              async (err: Error | null, row: any) => {
                if (err) {
                  reject(err);
                  return;
                }
    
                if (!row) {
                  reject(new NoReviewProductError()); // No review found
                  return;
                }
                // Delete the review for the given product model and user from the database
                const deleteReviewQuery = "DELETE FROM review WHERE model = ? AND username = ?";
                db.run(
                  deleteReviewQuery,
                  [model, username],
                  function (err) {
                    if (err) {
                      reject(err);
                      return;
                    }
                    // if (this.changes == 0){ already checked before
                    //   reject (new NoReviewProductError())
                    //   return
                    // }
                    resolve(); // Review deleted successfully
                  }
                );
    
              }
              )
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  async deleteReviewsOfProduct(model: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Check if there are any reviews for the product before attempting to delete them
        const checkProductExists = "SELECT model FROM product WHERE model = ?";
        db.get(
          checkProductExists,
          [model],
          async (err: Error | null, rows: any[]) => {
            if (err) {
              reject(err);
              return;
            }

            if (!rows) {
              reject(new ProductNotFoundError()); // product not found
              return;
            }

            // Delete all reviews for the given product model from the database
            const deleteReviewsQuery = "DELETE FROM review WHERE model = ?";
            db.run(deleteReviewsQuery, [model], async (err: Error | null) => {
              if (err) {
                reject(err);
                return;
              }
              resolve(); // Reviews deleted successfully
            });
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  async deleteAllReviews(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
          // Delete all reviews from the database
          const deleteAllReviewsQuery = "DELETE FROM review";
          db.run(deleteAllReviewsQuery, async (err: Error | null) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(); // All reviews deleted successfully
          });
        
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default ReviewDAO;
