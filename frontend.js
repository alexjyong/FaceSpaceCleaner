$( document ).ready(function() {

    //open hyperlinks on the UI in the browser.
	$(document).on('click', 'a[href^="http"]', function(event) {
        event.preventDefault();
        window.Electron.shell.openExternal(this.href);
    });

	//handle showing the modal on user click.
    $('#modal_show').click(function() {
        $('#modal1').modal('show')
    });
    $('#modal2_show').click(function() {
        $('#modal2').modal('show')
    });

    $('#do_it_button').click(function(event) {
		 //run the facebook module
        delete_fb_stuff = require('./delete_fb_stuff');
        event.preventDefault();
       
        

        var username = $("#username").val();
        var password = $("#password").val();
        var twofactor = $("#twofactor").val();

        if (!username || !password || username == "" || password == "") {
            alert("Username and password are required.");
            return;
        }

        var categories = $("#categories").val();
        if (!categories || categories =="") {
            alert("You need to select some categories.");
            return;
        }
        //categories = categories.join(" ");
        var years = $("#years").val();
        if (!years || years =="") {
            alert("You need to select some years.");
            return;
        }
        //years = years.join(" ");
        var months = $("#months").val();
        if (!months || months == "") {
            alert("You need to select some months.");
            return;
        }

        if (twofactor) {
            var r = confirm("Two factor support in the application at this time is a bit rough, and may not work. You may be better off disabling two factor on your account, then trying to run this script. Are you sure you want to continue?");
            if (r){

            }
            else {
                return;
            }

        }

        alert("Please do not click anywhere on the browser window that will pop up while the script is running. This will break the application. 😊");

        $("#status").val("Running script...");

        try {
            var result = delete_fb_stuff.main(username,password,categories,years,months,twofactor).then(function(value) {

                if (!value) {
                    $("#status").val("Fatal error running script!");
                }
                else {

                    alert(value.message);
                    $("#status").val(value.message);
                }

            });

        }
        catch(err) {
            $("#status").val(err);
        }
    });


    //the below code goes and builds up the select options.
    var currentYear = (new Date()).getFullYear();
    var years = [];
    for (let i = 2004; i <= currentYear; i++) {
      years.push(i.toString());
    }
    years.reverse();

    //add years
    for (var i = 0; i< years.length; i++) {
        var x = document.getElementById("years");
        var option = document.createElement("option");
        option.text = years[i];
        option.value = years[i];
        x.add(option);
    }

    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    //add months
    for (var i = 0; i< months.length; i++) {
        var x = document.getElementById("months");
        var option = document.createElement("option");
        option.text = months[i];
        option.value = months[i];
        x.add(option);
    }

    var categories = ["Posts",
      "Posts You're Tagged In",
      "Photos and Videos",
      "Photos You're Tagged In",
      "Others' Posts To Your Timeline",
      "Hidden From Timeline",
      "Likes and Reactions",
      "Comments",
      "Profile",
      "Added Friends",
      "Life Events",
      "Songs You've Listened To",
      "Articles You've Read",
      "Movies and TV",
      "Games",
      "Books",
      "Products You Wanted",
      "Notes",
      "Videos You've Watched",
      "Following",
      "Groups",
      "Events",
      "Polls",
      "Search History",
      "Saved",
      "Apps"]; 

    for (var i = 0; i< categories.length; i++) {
        var x = document.getElementById("categories");
        var option = document.createElement("option");
        option.text = categories[i];
        option.value = categories[i];
        x.add(option);
    }

    $('select').selectpicker({actionsBox: true});
});
function selectAll(selectBox,selectAll) { 
    // have we been passed an ID 
    if (typeof selectBox == "string") { 
        selectBox = document.getElementById(selectBox);
    } 
    // is the select box a multiple select box? 
    if (selectBox.type == "select-multiple") { 
        for (var i = 0; i < selectBox.options.length; i++) { 
             selectBox.options[i].selected = selectAll; 
        } 
    }
}	
