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

    // Action when they change the status of a gig
    $("#submitstatus").click(submit_status)

    // Action when they delete a gig
    $("#deletegig").click(delete_gig)


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
    let answerbutton = $("tr.gig[data-oid="+oid+"]").find("button.answer")
    answerbutton.text(answer)
    answerbutton.removeClass("btn-danger")
    answerbutton.addClass("btn-primary")


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

function submit_status() {
    let oid = $("#submitstatus").data("oid")
    let answer = $('input[name=statusradio]:checked')

    if (answer.length == 0) {
        // They haven't answered
        return
    }

    answer = $("label[for='" + answer.attr('id') + "']").text().trim()
    
    // We'll update the UI directly rather than waiting for the back
    // end to respond.
    let statusbutton = $("tr.gig[data-oid="+oid+"]").find("button.status")
    statusbutton.text(answer)

    // We report the change in status to the backend
    $.ajax(
        {
            url: backend,
            method: "POST",
            data: {
                action: "change_status",
                session: session,
                gig_id: oid,
                answer: answer
            },
            success: function() {
                // Don't need to do anything as we updated the UI directly
            },
            error: function(message) {
                console.log("Failed to update gig status")
                $("#gigtablebody").empty()
            }
        }
    )

    $("#statusdiv").modal("hide")
    // We need to apply the change to the surrounding tr classes
    let changetr = $("tr.gig[data-oid="+oid+"]")
    changetr.removeClass("Unconfirmed Confirmed Cancelled")
    changetr.addClass(answer)

}


function delete_gig() {

    let reallydelete = confirm("Do you really want to delete this gig?")

    if (!reallydelete) {
        $("#statusdiv").modal("hide")
        return
    }

    let oid = $("#submitstatus").data("oid")
    
    // We'll update the UI directly rather than waiting for the back
    // end to respond.
    $("tr.gig[data-oid="+oid+"]").remove()

    // We report the change in status to the backend
    $.ajax(
        {
            url: backend,
            method: "POST",
            data: {
                action: "delete_gig",
                session: session,
                gig_id: oid
            },
            success: function() {
                // Don't need to do anything as we updated the UI directly
            },
            error: function(message) {
                console.log("Failed to delete gig")
                $("#gigtablebody").empty()
            }
        }
    )

    $("#statusdiv").modal("hide")

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
    $("#email").val("")
    $("#password").val("")
    $("#logindiv").modal("show")
}

function process_login() {
    let email = $("#email").val()
    let password = $("#password").val()

    // Clear their password as soon as we've read it
    $("#password").val("")

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
                    let responseclass = "btn-primary"

                    for (let player of gig["players"]) {
                        if (player["_id"]["$oid"] == person_id) {
                            response = player["response"]
                        }
                    }

                    if (response == "No response") {
                        responseclass = "btn-danger"
                    }

                    if (is_admin) {
                        // We turn the status into a button so we can change it
                        gig.confirmedtext = '<button class="btn btn-primary status">'+gig.confirmed+"</button>"
                    }
                    else {
                        gig.confirmedtext = gig.confirmed
                    }

                    t.append(`
                        <tr class="gig ${gig.confirmed}" data-oid="${gig._id.$oid}">
                            <td>${new Date(gig.date).toLocaleString("en-UK",{ weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                            <td>${gig.confirmedtext}</td>
                            <td>${gig.name}</td>
                            <td>${gig.location}</td>
                            <td>${gig.start_time} - ${gig.end_time}</td>
                            <td><button class="answer btn ${responseclass}">${response}</button></td>
                        </tr>
                    `)
                }
                $(".answer").unbind()
                $(".answer").click(function(){
                    ask_about_gig($(this).parent().parent().data("oid"),$(this).text())
                })

                $("button.status").unbind()
                $("button.status").click(function(){
                    change_status($(this).parent().parent().data("oid"),$(this).text())
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


function change_status(oid, current_answer) {
    $("#submitstatus").data("oid", oid)
    let al = $("#statuslist")
    al.empty(); 

    ["Confirmed","Unconfirmed","Cancelled"].forEach(
        answer => {
            let selected = ""
            if (answer == current_answer) {
                selected = "checked"
            }
            let classname = answer.toLowerCase()
    
            al.append(`
            <div class="form-check">
            <input class="form-check-input" type="radio" name="statusradio" id="statusanswer${classname}" ${selected}>
            <label class="form-check-label" for="statusanswer${classname}">
              ${answer}
            </label>
          </div>
            `)
        }
    )

    $("#statusdiv").modal("show")
}