// Import third party packages using (require()):
const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const path = require("path");
const DBPath = path.join(__dirname, "todoApplication.db");
const sqlite3 = require("sqlite3");

// Initializing Database connection and server:

let DBConnection = null;
const initializingDbAndServer = async () => {
  try {
    DBConnection = await open({
      filename: DBPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
};
initializingDbAndServer();

// API-1
// GET todo list using API with GET Method:

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const covertDBObjectToResponseObject = (DBObject) => {
  return {
    id: DBObject.id,
    todo: DBObject.todo,
    priority: DBObject.priority,
    status: DBObject.status,
  };
};

app.get("/todos/", async (request, response) => {
  let getListOfTodosWithSqlQuery = "";
  let listOfTodo = null;
  const { status, priority, search_q = "" } = request.query;
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getListOfTodosWithSqlQuery = `
    SELECT 
    *
    FROM
      todo
    WHERE
      todo LIKE "%${search_q}%"
      AND status = "${status}"
      AND priority = "${priority}";
    `;
      break;
    case hasPriorityProperty(request.query):
      getListOfTodosWithSqlQuery = `
    SELECT 
    *
    FROM
      todo
    WHERE
      todo LIKE "%${search_q}%"
      AND priority = "${priority}";
    `;
      break;
    case hasStatusProperty(request.query):
      getListOfTodosWithSqlQuery = `
    SELECT 
    *
    FROM
      todo
    WHERE
      todo LIKE "%${search_q}%"
      AND status = "${status}";
    `;
      break;
    default:
      getListOfTodosWithSqlQuery = `
    SELECT 
    *
    FROM
      todo
    WHERE
      todo LIKE "%${search_q}%";
    `;
      break;
  }

  listOfTodo = await DBConnection.all(getListOfTodosWithSqlQuery);
  response.send(
    listOfTodo.map((eachTodo) => covertDBObjectToResponseObject(eachTodo))
  );
  //response.send(listOfTodo);
});

//Get Spcific todo using API with GET Method:
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getSpecificTodoWithSQlQuery = `
SELECT *
FROM
todo
WHERE
id = ${todoId};
`;
  const todo = await DBConnection.get(getSpecificTodoWithSQlQuery);
  response.send(covertDBObjectToResponseObject(todo));
});

//Create a todo using API With POST Method:

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createTodoWithSqlQuery = `
    INSERT INTO todo(id, todo, priority, status)
    VALUES(
         ${id},
        "${todo}",
        "${priority}",
        "${status}"
    );
    `;
  await DBConnection.run(createTodoWithSqlQuery);
  response.send("Todo Successfully Added");
});

// update Specific todo details using API with PUT Method:

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updatedField = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.todo !== undefined:
      updatedField = "Todo";
      break;
    case requestBody.priority !== undefined:
      updatedField = "Priority";
      break;
    case requestBody.status !== undefined:
      updatedField = "Status";
      break;
  }

  const getExistingTodoWithSqlQuery = `
        SELECT
        *
        FROM
        todo
        WHERE
        id = ${todoId};
        `;
  const existingTodo = await DBConnection.get(getExistingTodoWithSqlQuery);

  const {
    todo = existingTodo.todo,
    priority = existingTodo.priority,
    status = existingTodo.status,
  } = request.body;

  const updateTodoWithSqlQuery = `
UPDATE
todo
SET
todo = "${todo}",
priority = "${priority}",
status = "${status}";
`;
  await DBConnection.run(updateTodoWithSqlQuery);
  response.send(`${updatedField} Updated`);
});

// delete Specific todo using API with DELETE method:

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteSpecificTodoWithSqlQuery = `
    DELETE
    FROM
    todo 
    WHERE
    id = ${todoId};
    `;
  await DBConnection.run(deleteSpecificTodoWithSqlQuery);
  response.send("Todo Deleted");
});

module.exports = app;
