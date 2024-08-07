# Project Estimation - CURRENT

Date: 4/5/2024

Version: 2.0

# Estimation approach

Consider the EZElectronics project in CURRENT version (as given by the teachers), assume that you are going to develop the project INDEPENDENT of the deadlines of the course, and from scratch

# Estimate by size

###

|                                                                                                         | Estimate |
| ------------------------------------------------------------------------------------------------------- | -------- |
| NC = Estimated number of classes to be developed                                                        | 5        |
| A = Estimated average size per class, in LOC                                                            | 180      |
| S = Estimated size of project, in LOC (= NC \* A)                                                       | 900      |
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)                    | 90       |
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro)                                     | 2700     |
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) | 0.56     |

# Estimate by product decomposition

###

| component name       | Estimated effort (person hours) |
| -------------------- | ------------------------------- |
| requirement document |              35                   |
| GUI prototype        |           25                      |
| design document      |              10                   |
| code                |   25                              |
| unit tests           |            25                     |
| api tests          |   20                              |
| management documents |   25                              |

# Estimate by activity decomposition

###

| Activity name | Estimated effort (person hours) |
| ------------- | ------------------------------- |
|   **Requirements Documents**             |       33                          |
|    Functional Requirements          |      3                           |
|  Non Functional Requirements          |     1                            |
|  Context diagram and interfaces          |     2                            |
|  Stories and personas          |     1                            |
|  Use case diagram          |         4                        |
|  Use case scenarios          |            22                     |
|   **GUI Prototype**            |       24                          |
|   Manager Panel          |      2                           |
|   Admin Panel          |      2                           |
| New Product          |     2                            |
|  Products List          |                 2                |
|     Shopping Cart          |         2                        |
|     Purchase history          |         2                        |
|     Selling History          |         2                        |
|      User Login          |            2                     |
|      User Profile          |            2                     |
|      User Register          |            2                     |
|      New Product By models          |            2                     |
|      Product Details          |            2                     |
|   **Coding**            |       43                          |
|    Classes Setup          |      9                           |
|  Server Setup          |     8                            |
| Authentication Management          |                  8               |
|     Product Management          |         6                        |
|      Cart Management          |            6                    |
|      User Management          |            6                     |
|   **Unit Testing**            |       26                          |
|  Authentication Testing          |                 8                |
|      Product Testing          |         6                        |
|       Cart Testing          |            6                    |
|       User Testing          |            6                     |
|   **Manual Testing**            |       20                          |
|  Authentication Testing          |                 5                |
|      Product Testing          |         5                        |
|      Cart Testing          |            5                    |
|       User Testing          |            5                     |
|   **Management Documents**            |       48                          |
|     Real Estimation          |                 8                |
|     Functional documents          |                 16                |
|  **Final Technical Report**          |         24                        |
###

![Estimation gantt](V1-Images/GanttV1.png)

Note: we decided to consider the gantt chart as if we have 1 working hour per working day as an average and we are four people.
Each blue bar indicates that one person is working on that specific task in that moment. A green bar indicates that two people are working on that specific task in that moment. Orange bars indicates 3 people on that specific task. Purple indicates that everybody works on the same task. 

# Summary

Report here the results of the three estimation approaches. The estimates may differ. Discuss here the possible reasons for the difference

|                                    | Estimated effort (in ph) | Estimated duration (in weeks) |
| ---------------------------------- | ---------------- | ------------------ |
| estimate by size                   |     90             |0.6
| estimate by product decomposition  |           165       | 1
| estimate by activity decomposition |      218            | 1.5


Estimating by lines of code is too simple and may mislead (there are a lot of documents too). 
Estimating by product decomposition is fine but it is not as detailed ad estimating by activity.
We think estimation by activity is the most reliable. 
