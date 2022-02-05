const backend = "cgi-bin/umbrella_backend.py"
var session = ""

$( document ).ready(function() {
    show_login()

    // Action when they log in
    $("#login").click(process_login)
})

function show_login() {

    // Check to see if there's a valid session ID we can use

    session_id = Cookies.get("imagetrack_session_id")
    if (session_id) {
        // Validate the ID
        $.ajax(
            {
                url: backend,
                method: "POST",
                data: {
                    action: "session_login",
                    session_id: session_id,
                },
                success: function(session_string) {
                    let sections = session_string.split("\t")
                    if (sections.length < 2) {
                        session_id = ""
                        $("#logindiv").modal("show")
                        return
                    }
                    var realname = sections[0]
                    $("#maincontent").show()
    
                    // Get their list of submissions
                    populate_submissions(undefined)
                },
                error: function(message) {
                    console.log("Existing session didn't validate")
                    $("#logindiv").modal("show")
                }
            }
        )
    }
    else {
        $("#logindiv").modal("show")
    }
}

function logout() {
    session_id = ""
    Cookies.remove("sierra_session_id")
    $("#submissions").html("")
    $("#maincontent").hide()
    $("#logindiv").modal("show")
}

function process_login() {
    email = $("#email").val()
    password = $("#password").val()

    $.ajax(
        {
            url: backend,
            method: "POST",
            data: {
                action: "login",
                email: email,
                password: password
            },
            success: function(session_string) {
                let sections = session_string.split(" ")
                if (!session_string.startsWith("Success")) {
                    $("#loginerror").html("Login Failed")
                    $("#loginerror").show()
                    return
                }
                $("#loginerror").hide()
                session = sections[1]

                // Cookies.set("sierra_session_id", session_id)
                $("#logindiv").modal("hide")
                $("#maincontent").show()
                update_projects()

                // Get their list of submissions
                // populate_submissions(undefined)
            },
            error: function(message) {
                $("#loginerror").html("Login Failed")
                $("#loginerror").show()
            }
        }
    )
}

function update_projects(){

    $.ajax(
        {
            url: backend,
            method: "POST",
            data: {
                action: "list_projects",
                session: session
            },
            success: function(projects) {
                $("#projectbody").empty()

                let t = $('#projecttable').DataTable();

                for (let p in projects) {
                    let project = projects[p]
                    console.log(project)
                    t.row.add([
                        project["name"],
                        project["date"],
                        project["instrument"],
                        project["modality"],
                        "Folder"
                    ]).draw(false)
                }


            },
            error: function(message) {
                $("#projectbody").clear()
            }
        }
    )

}