const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");
const app = express();
const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error:${error}`);
    process.exit(1);
  }
};
initializeDbAndServer();
const convertDbObject = (objectItem) => {
  return {
    id: objectItem.id,
    todo: objectItem.todo,
    priority: objectItem.priority,
    status: objectItem.status,
    category: objectItem.category,
    dueDate: objectItem.due_date,
  };
};

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
const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

//Returns a list of all the players in the player table
// API 1

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", category, priority, status } = request.query;

  switch (true) {
    case hasCategoryAndStatusProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `select * from todo where todo like '%${search_q}%' and status='${status}' and category='${category}';`;
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `select * from todo where todo like '%${search_q}%' and category='${category}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryAndPriorityProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "HIGH"
        ) {
          getTodoQuery = `select * from todo where todo like '%${search_q}%' and priority='${priority}' and category='${category}';`;
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `select * from todo where todo like '%${search_q}%' and status='${status}' and priority='${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "HIGH") {
        getTodoQuery = `select * from todo where todo like '%${search_q}%' and priority='${priority}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `select * from todo where todo like '%${search_q}%' and status='${status}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    default:
      getTodoQuery = `select * from todo where todo like '%${search_q}%';`;
  }
  data = await db.all(getTodoQuery);
  response.send(data.map((eachTodo) => convertDbObject(eachTodo)));
});

// API 2
//Returns a specific todo based on the todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoIdQuery = `select * from todo where id=${todoId};`;
  const getTodoIdQueryResponse = await db.get(getTodoIdQuery);
  response.send(convertDbObject(getTodoIdQueryResponse));
});

// API 3
//Returns a list of all todos with a specific due date in the query parameter /agenda/?date=2021-12-12

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const getTodoDateQuery = `select * from todo where due_date='${newDate}';`;
    const getTodoDateQueryResponse = await db.all(getTodoDateQuery);
    response.send(
      getTodoDateQueryResponse.map((eachTodo) => convertDbObject(eachTodo))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});
// Create a todo in the todo table,
//API 4
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "HIGH") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(date, "yyyy-MM-dd")) {
          const createNewDate = format(new Date(date), "yyyy-MM-dd");
          const createTodoQuery = `insert into todo(id,todo,priority,status,category,due_date)
    values (${id},'${todo}','${priority}','${status}','${category}','${createNewDate}');`;
          await db.run(createTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API 5
//Updates the details of a specific todo based on the todo ID
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const getUpdateTodoQuery = `select * from todo where id=${todoId};`;
  const getUpdateTodo = await db.get(getUpdateTodoQuery);
  const {
    todo = getUpdateTodo.todo,
    status = getUpdateTodo.status,
    priority = getUpdateTodo.priority,
    category = getUpdateTodo.category,
    dueDate = getUpdateTodo.dueDate,
  } = request.body;
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateColumn = "Status";
        const updateTodoQuery = `update todo set todo='${todo}',
    priority='${priority}',status='${status}',category='${category}',dueDate='${dueDate}' where id=${todoId};`;
        await db.run(updateTodoQuery);
        response.send(`${updateColumn} updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "HIGH") {
        updateColumn = "Priority";
        const updateTodoQuery = `update todo set todo='${todo}',
    priority='${priority}',status='${status}',category='${category}',dueDate='${dueDate}' where id=${todoId};`;
        await db.run(updateTodoQuery);
        response.send(`${updateColumn} updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateColumn = "Category";
        const updateTodoQuery = `update todo set todo='${todo}',
    priority='${priority}',status='${status}',category='${category}',dueDate='${dueDate}' where id=${todoId};`;
        await db.run(updateTodoQuery);
        response.send(`${updateColumn} updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${newDueDate}' WHERE id = ${todoId};`;

        await database.run(updateTodoQuery);
        response.send(`Due Date Updated`);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

// API 6
//Deletes a todo from the todo table based on the todo ID
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `delete from todo where id=${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
