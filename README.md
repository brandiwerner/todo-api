# Description



This project is the api for the todo list application found [here](https://github.com/brandiwerner/todo-list).


## Building and Running

1. Clone this repo
2. Install packages via `npm i`
3. Run application via `npm run start`
4. The api will be running on `http://localhost:3001/`

Note: To connect to the database you will need to provide the Database Connection URL via the following steps:
1. Create a `.env` file at the root of this project
2. Add a `DB_CONNECTION_URL` variable to the file and set it to your Database Connection URL like so 
``` 
DB_CONNECTION_URL=yourURL
```