const 
    config = require('./config.json'),
    Mongoose = require('mongoose')

    // To connect MLAB database
Mongoose.connect(config.uri)
Mongoose.connection.on('error',err =>{
    console.log('MongoDB connection Error:'+ err)
})

    // To connect localhost database


    // Mongoose.connect('mongodb://localhost/todoapp');
  
    // Mongoose.connection.on('error',err =>{
    //     console.log('MongoDB connection Error:'+ err)
    // })

//Project Schema 
const ProjectSchema = new Mongoose.Schema({
    name:String
},{strict:false})

//Todo Schema
const TodoSchema = new Mongoose.Schema({
    desc:String,
    project:String,
    done:Boolean,
    edit:Boolean,
    date:Date,
},{strict:false})

//create Mongoose models
const 
    Project = Mongoose.model('projects',ProjectSchema)
    Todo =Mongoose.model('todos',TodoSchema)

// fetch all the not null projects from database
const  activeProject = () => Project.find({name:{$ne:null}})

//fetch project by name from database
const findProjectByName = name => Project.findOne({ name: { $regex: `^${name}$`, $options: 'i' } })

//fetch all the todos from todo collection by project name
const findTodoByProject = pname =>Todo.find({project:pname})

//find todo by it's desc and name and update status
const changeStatus =(description,status,pname) => Todo.findOneAndUpdate({desc:description,project:pname},{done:status})

//find todo  by name,desc and remove from collection
const removeTodo = (description,pname) => Todo.findOneAndRemove({desc:description,project:pname})


//update project name for all the todos with new name
const editTodoProjectName = (oldname,newname) => Todo.update({project:{$eq:oldname}},{project:newname},{multi:true})

//update edit field of todo 
const toggleTodo = (todo,project,edit) => Todo.findOneAndUpdate({desc:todo,project:project},{$set:{edit:edit}},{ "new": true})

//remove project from project collection
const removeProject = (pname) =>Project.findOneAndRemove({name:pname})

//remove all the todos based on project name
const removeTaskByProject = (pname) =>  Todo.remove({project:{$eq:pname}})

//edit todo in todo collection
const editTodo = (project,todo,newtodo) => Todo.findOneAndUpdate({project:project,desc:todo},{$set:{desc:newtodo,edit:false}},{ "new": true})

//remove all the completed todo from todo collection
const archiveTodo = (pname) => Todo.remove({project:pname,done:true})

//create a new project in project collection
const createProject = (pname) => {
    //finding if project is already is db
    return findProjectByName(pname)
            .then(found=>{
                if(found)
                    throw new error('project already exists')

                return{
                    name:pname,
                }
            })//create project
            .then(project =>Project.create(project))
          
}

//find project by old name and update with new name in project collection
const editProject = (oldname,newname) =>{
    return findProjectByName(newname)
    .then(found=>{
        if(found)
            throw new error('project already exists')

        return{
            oldname:oldname,
            newname:newname
        }
    })
    .then(project =>Project.findOneAndUpdate({name:project.oldname},{$set:{name:project.newname}},{ "new": true}))
}

//create new todo  based on passed todo object
const createTodo = todo => {
    const newTodo= {
        project:todo.project,
        desc:todo.desc,
        done:false,
        edit:false,
        date:new Date()
    }

    return Todo.create(newTodo)
}


//exporting mongoose function to use in socket.js file 
module.exports = {
    activeProject,
    createProject,
    createTodo,
    removeTodo,
    findProjectByName,
    findTodoByProject,
    changeStatus,
    editProject,
    removeProject,
    toggleTodo,
    editTodo,
    removeTaskByProject,
    archiveTodo,
    editTodoProjectName

}
