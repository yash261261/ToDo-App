const socket = io()

// project Component - display all the projects from database
const projectComponent = {
   template:`<div>
                <li v-for="data in projects" v-on:click="displayTodos(data.name)" class="list-group-item d-flex justify-content-between align-items-center">
                <b>{{data.name}}</b>    
                </li>
            </div>`,

    props: ['projects','displayTodos']
}

//display Component - display only selected project name and button to remove and edit project name
const displayComponent = {
    template:` <div class="col-md-12">
                 <input v-show="proedit"  type="text"  style="width:50%;" :value="activeProject" @keyup.enter="editProject(activeProject,$event.target.value)">
                  <label v-show="!proedit"><b>{{activeProject}}</b></label>
                    <span class="icon" style="float: right;">
                         <i v-on:click="toggleProject(activeProject,proedit)"  class="fa fa-edit has-text-info"></i>
                    </span>
                    <span class="icon"  style="float: right;">
                         <i v-on:click="removeProject(activeProject)"  class="fa fa-trash has-text-danger"></i>
                    </span>
              </div>`,
  props:['proedit','activeProject','editProject','toggleProject','removeProject']
}

//todos Component - display all the todos from selected project from project component
const todosComponent ={
    template:`<div class="form-group full-width">
              <div v-for="todo in todos">
                <span v-show="!todo.edit">
                    <input v-bind:checked='todo.done' v-on:change="changeStatus(todo.desc,todo.done)"  type="checkbox" >
                    <label  :class="{strikethrough:todo.done}" >{{todo.desc}}</label>
                    <span class="icon" style="float: right;"><i  v-on:click="toggleTodo(todo.desc,todo.project,todo.edit)"  class="fa fa-edit has-text-info"></i></span>
                    <span class="icon"  style="float: right;"><i v-on:click="removeTodo(todo.desc)"  class="fa fa-trash has-text-danger"></i></span>
                </span>
                <span v-show="todo.edit">
                    <input type="text"  style="width:50%;"  :value="todo.desc"  @keyup.enter="editTodo(todo.project,todo.desc,$event.target.value)" >
                    <span class="icon" style="float: right;"><i  v-on:click="toggleTodo(todo.desc,todo.project,todo.edit)"  class="fa fa-edit has-text-info"></i></span>
                </span>
             </div>
             </div>`,
    props:['todos','toggleTodo','removeTodo','editTodo','changeStatus']
}


const app =new Vue({
    el:'#todo-app',
    data:{
        projects:[],
        todos:[],
        todo:'',
        project:'',
        activeProject:'',//it is project name that selected from list of projects
        status:'', // using when we are changing status from done to undone in list of todos
        failedproject:'',
        proedit:false,//just to toggle textbox at time of updating project name by default it is false
        start:''
    },
    methods:{

        //create projects take project name and add in database
        createProject:function(){
            if(!this.project)
                return
            socket.emit('create-project',this.project)
        },
        
         //to modified the activeproject name
         editProject: function(oldpname,newpname){
           
            socket.emit('edit-project',oldpname,newpname)
        },


          //remove project from application database
          removeProject :function(project){
            if(!project)
                return
            socket.emit('remove-project',project)
         },

        //creating Todos for Project
        createTodo: function(){
            if(!this.todo)
                return
            socket.emit('create-todo',{desc:this.todo,project:this.activeProject})
        },

        //display todos for selected project
        displayTodos:  function(project){
            if(!project)
                return
            //activeProject is project selected from list of project for that socketId
            this.activeProject=project
            socket.emit('display-todos',this.activeProject)
        },



        //change status of todo like done and undone
        changeStatus: function(todo,status){
            let done
            if(status===true)
                done=false
            else
                done=true
            if(!todo)
                return
            socket.emit('change-status',todo,done,this.activeProject)
        },

        //removes todos from list of todos for activeProject
        removeTodo: function(todo){
            if(!todo)
                return
            socket.emit('remove-todo',todo,this.activeProject)
        },

       

        //same as project to toggle textbox to update todos  using edit boolean value from database
        toggleTodo: function(todo,project,edit){

            if(edit==false)
                socket.emit('toggle-todo',todo,project,true)
            else
                socket.emit('toggle-todo',todo,project,false)
        
        },

      

         //edit todo of project based on project name
        editTodo: function(project,todo,newtodo){
            if(!newtodo)
                return
            socket.emit('edit-todo',project,todo,newtodo)
        },

        //remove all the completed todos from activeProject from database
        archiveTodo: function(){
            socket.emit('archive-todo',this.activeProject)
        },


            //to enable and disable textbox when user want to modified projectname
            toggleProject: function(project,proedit){
                if(!project)
                    return
    
                if(proedit===false)
                     this.proedit=true;
                else
                    this.proedit=false
            },

    },
    components: { 
        'project-component': projectComponent,
        'todos-component':todosComponent,
        'display-component':displayComponent   
    }
})

//clinet side socket events

//on new socket connection it refresh projects from database for new user
socket.on('refresh-project',projects =>{
  
    if(projects.length>0)
    {
        app.projects=[]
        app.projects=projects
        app.start=false
        if(app.activeProject==='')
        {
            app.activeProject=projects[0].name 
        }
        app.displayTodos(app.activeProject)
    }
    else if(projects.length===0)
    {
        app.start=true
        app.activeProject=''
        app.todos=[]
        app.projects=[]
       
    }
})

//on creation of successful project setting app variables
socket.on('successful-project',content=>{
    app.project=''
    app.failedproject=''
    app.projects.push(content)

    //if created project is first one then show that project as activeProject
    if(app.projects.length === 1)
    {
        app.start=false
        app.activeProject=app.projects[0].name
        app.displayTodos(app.activeProject)
    }
})

//add created todo in list of todos of activeProject 
socket.on('successful-todo',content=>{
    app.todo=''
    app.displayTodos(app.activeProject) 
})

//when project with same name is already inside database show error for project
socket.on('failed-project',project =>{

  //  if(project.name===app.project)
        app.failedproject=project.name
})

//display todo for activeproject
socket.on('display-todos',todos=>{
    app.todos=[]
    app.todos=todos
})

//after editing todo to toggle textbox in normal text calling toggleTodo function
socket.on('edited-todos',todo=>{
    app.toggleTodo(todo.project,todo.desc,todo.edit)
    app.displayTodos(app.activeProject)
})

//display new todos for activeProject only
socket.on('refresh-todos',(todos,project)=>{
    if(app.activeProject===project)
    {
        app.todos=[]
        app.todos=todos
    }
})

//after project update disable project edit textbox
socket.on('updated-project',(projects,oldname,newpname)=>{
    app.proedit=false
    app.projects=projects
    app.failedproject=''
    if(app.activeProject===oldname)
    {
        app.activeProject=newpname
    }

}),

//refresh projects after removing project
socket.on('remove-project',(projects,project)=>{
   
    if(projects.length>0)
    {
         app.start=false
         app.projects=[]
         app.projects=projects
        if(app.activeProject===project)
        {
        app.activeProject=projects[0].name
        app.displayTodos(app.activeProject)
        }
    }
    else if(projects.length===0)
    {
        app.start=true
        app.activeProject=''
        app.todos=[]
        app.projects=[]
    }
})
