# companies-tree

Problem

You are designing a web application that manages organizational structure for parent and child companies.
Each company has two properties, they are company name and estimated annual earnings.
There are two types of companies: 1- Main company, 2 - Subsidiary company.
The company can belong only to one company but can have a few child companies.
 
 
Requirements
- The application should allow a user to view/add/edit/delete any company.
- Company name and estimated earnings should be stored in database
- Show companies tree
 
Example:
Name | Company Estimated Earnings | Company Estimated Earnings + Child Companies Estimated Earnings
 -Company1 | 25K$ | 53K$
  --Company2 | 13K$ | 18K$
   ---Company3 | 5K$
  --Company4 | 10K$
 
- Nesting level is not limited
- Single page approach should be used.
- Any solution should demonstrate best practices where appropriate such as SOLID principles.
 
 
To be supplied
- Assessment Code (ideally hosted via something like GitHub)
- Web application should be deployed and link to the app should be provided
- Any database scripts
- Any setup instructions
 
 __________________________________________________________________________________________________
 You need for work!
 1) npm install --save express mongodb body-parser
 2) npm install --save-dev nodemon
 3) npm install express-handlebars
 __________________________________________________________________________________________________
 Run:
     npm start
   
 Url:
     http://localhost:8000
