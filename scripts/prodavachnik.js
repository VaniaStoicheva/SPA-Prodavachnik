function startApp() {
    const articleDiv=$('#article');
    //show button menu
    $('header').find('a').show();

    //show all views
    function showHideMenuLinks(view) {
        $('section').hide();
        switch (view){
            case 'home':
                $('#viewHome').show();
                break;
            case 'register':
                $('#viewRegister').show();
                break;
            case 'login':
                $('#viewLogin').show();
                break;
            case 'article':
                $('#viewArticle').show();
                loadArticle();
                break;
            case 'createArticle':
                $('#viewCreateArticle').show();
                break;
            case 'editArticle':
                $('#viewEditArticle').show();
                break;
            case 'detailsArticle':
                $('#viewDetailsArticle').show();
                break;
        }
    }
    showHideMenuLinks('home');
    //Attach event listeners
    $('#linkHome').click(()=>showHideMenuLinks('home'));
    $('#linkRegister').click(()=>showHideMenuLinks('register'));
    $('#linkLogin').click(()=>showHideMenuLinks('login'));
    $('#linkListArticle').click(()=>showHideMenuLinks('article'));
    $('#linkCreateArticle').click(()=>showHideMenuLinks('createArticle'));
    $('#linkLogout').click(logout);

    $('#buttonLoginUser').click(login);
    $('#buttonRegisterUser').click(register);
    $('#buttonCreateArticle').click(createArticle);

    //Notification Attach AJAX "loading" event listener
    $(document).on({
        ajaxStart: function() { $("#loadingBox").show() },
        ajaxStop: function() { $("#loadingBox").fadeOut() }
    });
    // Bind the info / error boxes
    $("#infoBox, #errorBox").click(function() {
        $(this).fadeOut();
    });
    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(function() {
            $('#infoBox').fadeOut();
        }, 3000);
    }
    function showError(errorMsg) {
        $('#errorBox').text("Error: " + errorMsg);
        $('#errorBox').show();
    }
    function handleError(reason) {
        showError(reason.responseJSON.description);
    }
    
    let requester=(()=>{
        const baseUrl='https://baas.kinvey.com/';
        const appKey='kid_ryRGxOPDW';
        const appSecret='d26d63aa43ee44e989f8d29c6d0a58db';

        function makeAuth(type) {
            if(type==='basic')return "Basic " + btoa(appKey + ":" + appSecret);
            else return "Kinvey "+localStorage.getItem('authtoken');
        }
        function makeRequest(method,module,url,auth) {
            return req={
                url:baseUrl+module+'/'+appKey+'/'+url,
                method,
                headers:{
                    'Authorization':makeAuth(auth),
                }
            }
        }
        function get(module,url,auth) {
            return $.ajax(makeRequest('GET',module,url,auth));
        }
        function post(module,url,data,auth) {
            let req=makeRequest('POST',module,url,auth);
            req.data=JSON.stringify(data);
            req.headers['Content-Type']='application/json';
            return $.ajax(req);
        }
        function update(module,url,data,auth) {
            let req=makeRequest('PUT',module,url,auth);
            req.data=JSON.stringify(data);
            req.headers['Content-Type']='application/json';
            return $.ajax(req);
        }
        function remove(module,url,auth) {
            return $.ajax(makeRequest('DELETE',module,url,auth));
        }
        return {get,post,update,remove}
    })();
    //handchek : requester.get('appdata','','basic');

    if(localStorage.getItem('authtoken')!==null && localStorage.getItem('username')!==null){
        userLoggedIn();
    }else{
        userLoggedOut();
    }
    function createArticle() {
        let form=$('#formCreateArticle');
        let title=form.find('input[name="title"]').val();
        let description=form.find('textarea[name="description"]').val();
        let price=form.find('input[name="price"]').val();
        let imageURL=form.find('input[name="image"]').val();
        let date=(new Date()).toString('yyyy-MM-dd');
        //let date='2009-34-12';
        let publisher=localStorage.getItem('username');
        if(title.length===0){
        showError('Title cannot be empty!');
        return;
        }
        if(price.length===0){
            showError('Price cannot be empty!');
            return;
        }
        let newAdv={
            title,description,price,imageURL,date,publisher
        };
        requester.post('appdata','adv',newAdv)
            .then(loadCreateArticle)
            .catch(handleError);

    }
    function loadCreateArticle() {
        showInfo('Created successful!')
        showHideMenuLinks('article');
    }
    function loadArticle() {
      requester.get('appdata', 'adv')
          .then(listArticle)
          .catch(handleError);
    }
    function listArticle(data) {
            articleDiv.empty();
            if (data.length === 0) {
                articleDiv.append('<p>No advertisements in database!</p>');
                return;
            }
            for (let advs in data) {
                let html = $('<div>');
                html.addClass('ad-box');
                let title=$(`<div class="ad-title">${data[advs]['title']}</div>`);
                let aclAdv=data[advs]['_acl'];
                if(aclAdv['creator']===localStorage.getItem('id')) {
                    let deleteBtn = $('<button>&#10006</button>')
                        .click(()=>deleteAdv(data[advs]['_id']));
                    deleteBtn.addClass('ad-control');
                    deleteBtn.appendTo(title);

                    let editBtn = $('<button>&#9998</button>')
                        .click(()=>editAdv(data[advs]));
                    editBtn.addClass('ad-control');
                    editBtn.appendTo(title);
                }
                html.append(title);
                html.append(`<div><img src="${data[advs]['imageURL']}"></div>`);
                html.append(`<div>Price: ${Number(data[advs]['price']).toFixed(2)} | By ${data[advs]['publisher']}</div>`);
                if(aclAdv['creator']===localStorage.getItem('id')) {
                    let detailsBtn = $('<button >Read more...</button>')
                        .click(() => detailsAdv(data[advs]));
                    detailsBtn.addClass('ad-details');
                    html.append(detailsBtn);
                }
                articleDiv.append(html);
            }
        }
    function detailsAdv(data) {
        $('#viewDetailsArticle').empty();
            let advertInfo=$('<div class="ad-details">').append(
                $(`<img src=${data.imageURL}>`),
                $('<br>'),
                $('<label>').text('Title: '),
                $('<h1>').text(`${data.title}`),
                $('<label>').text('Description: '),
                $('<h1>').text(`${data.description}`),
                $('<label>').text('Publisher:'),
                $('<h1>').text(`${data.publisher}`),
                $('<label>').text('Date: '),
                $('<h1>').text(`${data.date}`))
        $('#viewDetailsArticle').append(advertInfo);
            showHideMenuLinks('detailsArticle')
        }
    function editAdv(data) {
        let form=$('#formEditArticle');
        form.find('input[name="title"]').val(data['title']);
            form.find('textarea[name="description"]').val(data['description']);
            form.find('input[name="price"]').val(data['price']);
            form.find('input[name="image"]').val(data['imageURL']);
            let date=data['date'];
            let publisher=data['publisher'];
            let id=data['_id'];
            showHideMenuLinks('editArticle');

            $('#buttonEditArticle').click(()=>isEditAdv(id,date,publisher));
        }
    function isEditAdv(id,date,publisher) {
            let form=$('#formEditArticle');
           let title=form.find('input[name="title"]').val();
           let description=form.find('textarea[name="description"]').val();
           let price=form.find('input[name="price"]').val();
           let imageURL=form.find('input[name="image"]').val();
           if(title.length===0){
               showError("Title cannot be empty!");
               return;
           }
           if(Number.isNaN(price)){
               showError("Price cannot be empty!");
               return;
           }
           let editedAdv={
               title,description,price,imageURL,date,publisher
           };
           requester.update('appdata','adv/'+id,editedAdv)
               .then(editSucc)
               .catch(handleError);

        }
    function editSucc() {
            $('#loadingBox').hide();
            showInfo("Edited successfuly!");
            showHideMenuLinks('article');
        }
    function deleteAdv(id) {
           requester.remove('appdata','adv/'+id)
               .then(isDeletedAdv)
               .catch(handleError);
        }
    function isDeletedAdv() {
            showInfo("Deleted successfuly!");
            showHideMenuLinks('article');
        }
    function userLoggedIn() {
        $('#loggedInUser').text('Welcome: '+localStorage.getItem('username')+'!');
        $('#loggedInUser').show();
        $('#linkLogin').hide();
        $('#linkRegister').hide();
        $('#linkLogout').show();
        $('#linkCreateArticle').show();
        $('#linkListArticle').show();

    }
    function userLoggedOut() {
        localStorage.clear();
        $('#loggedInUser').text('');
        $('#loggedInUser').hide();
        $('#linkLogin').show();
        $('#linkRegister').show();
        $('#linkLogout').hide();
        $('#linkCreateArticle').hide();
        $('#linkListArticle').hide();
        showHideMenuLinks('home');
    }
    function saveSession(data) {
        localStorage.setItem('username',data.username);
        localStorage.setItem('id',data._id);
        localStorage.setItem('authtoken',data._kmd.authtoken);
        userLoggedIn(data);
        showHideMenuLinks('article');
    }
    function login() {
        let form=$('#formLogin');
        let  username=form.find('input[name="username"]').val();
        let password=form.find('input[name="passwd"]').val();

        requester.post('user','login',{username,password},'basic')
            .then(saveSession)
            .catch(handleError);
    }
    function register() {
        let form=$('#formRegister');
        let  username=form.find('input[name="username"]').val();
        let password=form.find('input[name="passwd"]').val();

        requester.post('user','',{username,password},'basic')
            .then(saveSession)
            .catch(handleError);
    }
    function logout() {
        requester.post('user','_logout',{authtoken:localStorage.getItem('authtoken')})
            .then(userLoggedOut)
            .catch(handleError);


    }
}