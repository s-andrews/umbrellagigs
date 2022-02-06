const backend = "cgi-bin/umbrella_backend.py"
var session = ""
var is_admin = false
var name = ""

$( document ).ready(function() {
    show_login()

    // Action when they log in
    $("#login").click(process_login)

    $("#logoutbutton").click(logout)
})

function show_login() {

    // Check to see if there's a valid session ID we can use

    session = Cookies.get("umbrella_session_id")
    if (session) {
        // Validate the ID
        $.ajax(
            {
                url: backend,
                method: "POST",
                data: {
                    action: "validate_session",
                    session: session,
                },
                success: function(session_string) {
                    if (!session_string.startsWith("Success:")) {
                        // Login failed
                        Cookies.remove("umbrella_session_id")
                        show_login()
                        return
                    }
                    let sections = session_string.split("\t")
                    name = sections[0].substring(9)
                    $("#loginname").text(name)
                    is_admin = sections[1] == "True"
                    // TODO: Make isadmin class visible
                    $("#logindiv").modal("hide")
                    $("#maincontent").show()
    
                    // Get their list of submissions
                    update_gigs()
                },
                error: function(message) {
                    console.log("Existing session didn't validate")
                    Cookies.remove("umbrella_session_id")
                    show_login()
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
    Cookies.remove("umbrella_session_id")
    $("#gigtablebody").empty()
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

                Cookies.set("umbrella_session_id", session)
                show_login()
            },
            error: function(message) {
                $("#loginerror").html("Login Failed")
                $("#loginerror").show()
            }
        }
    )
}

function update_gigs(){

    $.ajax(
        {
            url: backend,
            method: "POST",
            data: {
                action: "list_gigs",
                session: session
            },
            success: function(gigs) {

                console.log(gigs)

                $("#gigtablebody").empty()

                let t = $('#gigtablebody')

                for (let g in gigs) {
                    let gig = gigs[g]

                    let confirmed = gig.confirmed ? "confirmed" : "unconfirmed"

                    t.append(`
                        <tr class="${confirmed}">
                            <td>${gig.date}</td>
                            <td>${gig.name}</td>
                            <td>${gig.location}</td>
                            <td>${gig.start_time} - ${gig.end_time}</td>
                            <td>Unknown</td>
                        </tr>
                    `)
                }


            },
            error: function(message) {
                $("#gigtablebody").empty()
            }
        }
    )

}