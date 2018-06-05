module.exports = (server,db) =>{

    const 
        io = require('socket.io')(server),
        moment = require('moment')

    io.on('connection',socket =>{

        db.activeProject()
                .then(projects => io.emit('refresh-project',projects))

        //return created project for  all socket connection
        socket.on('create-project',(name)=>{
            db.createProject(name)
                .then(created => io.emit('successful-project',created))
                .catch(err => io.emit('failed-project',{name:name}))
        })


         //edit project name for project and todos collection for all socket connection
         socket.on('edit-project',(oldpname,newpname)=>{
            db.editProject(oldpname,newpname)
            .then(project => db.editTodoProjectName(oldpname,newpname))
            .then(project => db.activeProject())
            .then(projects => io.emit('updated-project',projects,oldpname,newpname))
            .catch(err => io.emit('failed-project',{name:newpname}))
        })

        //removes  projects from database
        socket.on('remove-project',(project,socketid)=>{
            db.removeProject(project)
            .then(project=>db.removeTaskByProject(project.name))
            .then(todo=>db.activeProject())
            .then(projects => io.emit('remove-project',projects,project))
        })

        //return created todo for all socket connection
        socket.on('create-todo',data=>{
            db.createTodo(data)
                .then(created => io.emit('successful-todo',created))
        })

        //return list of todos by project name for requested connection
        socket.on('display-todos',(pname)=>{
            db.findTodoByProject(pname)
                    .then(todos =>socket.emit('display-todos',todos))
        })

        //change the status of todo and refresh list of todos for that todo's project 
        socket.on('change-status',(description,status,pname)=>{
            db.changeStatus(description,status,pname).then(todo=>db.findTodoByProject(pname))
            .then(todos => io.emit('refresh-todos',todos,pname))
                
        })

        //remove todo for one project and after removing display all todos for project
        socket.on('remove-todo',(description,pname)=>{
            db.removeTodo(description,pname).then(todos=>db.findTodoByProject(pname))
            .then(todos =>io.emit('refresh-todos',todos,pname))
        })

       

        //toggle textbox fot todo modification
        socket.on('toggle-todo',(todo,project,edit)=>{
            db.toggleTodo(todo,project,edit)
            .then(todos=>db.findTodoByProject(project))
            .then(todos =>socket.emit('display-todos',todos))
        })

        //after modification of todo refresh all the todo for that project
        socket.on('edit-todo',(project,todo,newtodo)=>{
            db.editTodo(project,todo,newtodo)
            .then(todos=>db.findTodoByProject(project))
            .then(todos =>io.emit('refresh-todos',todos,project))
        })

        //remove all the completed todos for project and refresh all the todos for project
        socket.on('archive-todo',(pname)=>{
            db.archiveTodo(pname).then(todos=>db.findTodoByProject(pname))
            .then(todos =>io.emit('refresh-todos',todos,pname))
        })
       
    })
}