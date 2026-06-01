//read user ID
const userId = localStorage.getItem("id");

//prevents direct access to dashboard.html
if(!userId){
    window.location.href = "index.html";
}


//function to load contacts automatically into the table
window.addEventListener('DOMContentLoaded', loadContacts);

async function loadContacts(){
    try{
        const response = await fetch('/api/SearchContact.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                search: "",
                userId: userId
            })
        });

        const data = await response.json();

        if(data.error){
            return;
        }

        const tbody = document.getElementById('contact-body');
        tbody.innerHTML = '';

        for(const contact of data.results){
            addRowToTable(
                contact.firstName,
                contact.lastName,
                contact.phone,
                contact.email
            );
        }

    } catch(error){
        console.log(error);
    }
}

/***** logout logic *****/
document.getElementById('logout').addEventListener('click', logout);

function logout(){
    localStorage.removeItem("id");
    window.location.href = "index.html";
}

//open add popup
function openAdd(){
    closeAll();
    document.getElementById('add-choice').style.display = 'flex';
}

function openUpdate(){

}

function closeAll(){
    ['add-choice', 'update-choice', 'confirm-delete-popup'].forEach(function(id) {
        document.getElementById(id).style.display = 'none';
    });
}

//escape key closes popup 
document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
        closeAll();
    }
});

/***** button listeners *****/

//open add popup
document.getElementById('add-contact').addEventListener('click', openAdd);

//cancel button
document.querySelectorAll('.action-cancel').forEach(function(button){
    button.addEventListener('click', closeAll)
});

//save contact button
document.querySelector('.action-save').addEventListener('click', addContact);

/***** Dashboard Actions *****/

//handles adding contact
async function addContact(){
    const firstName = document.getElementById('add-firstname').value.trim();
    const lastName = document.getElementById('add-lastname').value.trim();
    const phoneNumber = document.getElementById('add-phone').value.trim();
    const emailAddress = document.getElementById('add-email').value.trim();

    if(!firstName || !lastName || !phoneNumber || !emailAddress){
        alert('Please fill in all required fields.');
        return;
    }

    //API call 
    const contactData = {
        firstName: firstName,
        lastName: lastName,
        phone: phoneNumber,
        email: emailAddress,
        userId: userId
    };

    try{
        const response = await fetch("/api/AddContact.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(contactData)
        });

        const data = await response.json();

        console.log(data);

        if(data.id > 0){
            addRowToTable(firstName, lastName, phoneNumber, emailAddress);
            closeAll();
            clearAddForm();
        } else{
            alert(data.error);
            //document.getElementById("error-message").textContent = `❌ ${data.error} ❌`; //displays actual backend error
        }

    } catch(error){
        console.error("Add Contact Error:", error);

        alert(error.message);
    }

}

//handles deleting contact and related popup
function deleteContact(){

}

//handles updating contact and related popup
function updateContact(){

}

//handles cancelling user action
function cancelAction(){

}

/***** helper functions *****/
function addRowToTable(firstName, lastName, phoneNumber, emailAddress){
    const tbody = document.getElementById('contact-body');
    if(tbody.children.length === 1 && tbody.children[0].textContent.includes('No contacts found')){
        tbody.innerHTML = '';
    }

    const tr = document.createElement('tr');
    tr.innerHTML = 
        '<td style="display:none;"></td>' + 
        '<td>' + firstName + '</td>' +
        '<td>' + lastName + '</td>' +
        '<td>' + phoneNumber + '</td>' +
        '<td>' + emailAddress + '</td>';
    tbody.appendChild(tr);
}

function clearAddForm(){
    ['add-firstname', 'add-lastname', 'add-phone', 'add-email'].forEach(function(id){
        document.getElementById(id).value = '';
    });
}