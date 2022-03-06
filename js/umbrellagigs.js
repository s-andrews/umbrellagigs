const backend = "cgi-bin/umbrella_backend.py"
var session = ""
var is_admin = false
var person_id = ""
var gigs = ""

$( document ).ready(function() {
    show_login()

    // Action when they log in
    $("#login").click(process_login)
    // Also when they press return in the password field
    $("#password").keypress(function(e){
        if(e.keyCode == 13){
            process_login();
        }
    });

    // Action when they log out
    $("#logoutbutton").click(logout)

    // Action when they answer about a gig
    $("#submitanswer").click(submit_answer)
})

function submit_answer() {
    let oid = $("#submitanswer").data("oid")
    let answer = $('input[name=giganswerradio]:checked')

    if (answer.length == 0) {
        // They haven't answered
        return
    }

    answer = $("label[for='" + answer.attr('id') + "']").text().trim()
    

    // We'll update the UI directly rather than waiting for the back
    // end to respond.
    $("tr.gig[data-oid="+oid+"]").find("button.answer").text(answer)


    // We report the change in status to the backend
    $.ajax(
        {
            url: backend,
            method: "POST",
            data: {
                action: "answer_gig",
                session: session,
                gig_id: oid,
                answer: answer
            },
            success: function(gigs) {
                // Don't need to do anything as we updated the UI directly
            },
            error: function(message) {
                console.log("Failed to update gig answer")
                $("#gigtablebody").empty()
            }
        }
    )

    $("#answerdiv").modal("hide")

}


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
                    $("#loginname").text(sections[0].substring(9))
                    person_id = sections[1]
                    is_admin = sections[2] == "True"
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
            success: function(gigs_json) {

                gigs = gigs_json

                $("#gigtablebody").empty()

                let t = $('#gigtablebody')

                for (let g in gigs) {
                    let gig = gigs[g]

                    let response = "Unknown"

                    for (let player of gig["players"]) {
                        if (player["_id"]["$oid"] == person_id) {
                            response = player["response"]
                        }
                    }

                    t.append(`
                        <tr class="gig ${gig.confirmed}" data-oid="${gig._id.$oid}">
                            <td>${gig.date}</td>
                            <td>${gig.name}</td>
                            <td>${gig.location}</td>
                            <td>${gig.start_time} - ${gig.end_time}</td>
                            <td><button class="answer btn btn-primary">${response}</button></td>
                        </tr>
                    `)
                }
                $(".answer").unbind()
                $(".answer").click(function(){
                    ask_about_gig($(this).parent().parent().data("oid"),$(this).find("td").eq(4).text())
                })

            },
            error: function(message) {
                $("#gigtablebody").empty()
            }
        }
    )

}

function ask_about_gig(oid, current_answer) {
    $("#submitanswer").data("oid", oid)
    let al = $("#answerlist")
    al.empty(); 

    ["Available","Maybe","Unavailable"].forEach(
        answer => {
            let selected = ""
            if (answer == current_answer) {
                selected = "checked"
            }
            let classname = answer.toLowerCase()
    
            al.append(`
            <div class="form-check">
            <input class="form-check-input" type="radio" name="giganswerradio" id="giganswer${classname}" ${selected}>
            <label class="form-check-label" for="giganswer${classname}">
              ${answer}
            </label>
          </div>
            `)
        }
    )

    $("#answerdiv").modal("show")
}