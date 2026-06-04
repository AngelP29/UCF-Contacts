//read user ID
const userId = localStorage.getItem("id");

//prevents direct access to dashboard.html
if(!userId){
    window.location.href = "index.html";
}

var deleteMode = false;

//function to load contacts automatically into the table
window.addEventListener('DOMContentLoaded', loadContacts);


const PHONE_REGEX = /^\+?1?\s*[-.]?\s*\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePhone(phone) {
    return PHONE_REGEX.test(phone);
}

function validateEmail(email) {
    return EMAIL_REGEX.test(email);
}

// Shows error message and highlights input
function setFieldError(inputId, errorId, message) {
    document.getElementById(inputId).classList.add('input-invalid');
    document.getElementById(errorId).textContent = message;
}

// Clears error state from input
function clearFieldError(inputId, errorId) {
    document.getElementById(inputId).classList.remove('input-invalid');
    document.getElementById(errorId).textContent = '';
}

// Validates phone + email for a given form prefix ('add' or 'update')
// Returns true if both are valid
function validateContactFields(prefix) {
    const phone = document.getElementById(`${prefix}-phone`).value.trim();
    const email = document.getElementById(`${prefix}-email`).value.trim();
    let valid = true;

    clearFieldError(`${prefix}-phone`, `${prefix}-phone-error`);
    clearFieldError(`${prefix}-email`, `${prefix}-email-error`);

    if (!validatePhone(phone)) {
        setFieldError(`${prefix}-phone`, `${prefix}-phone-error`, 'Enter a valid phone number in the format 111-222-333)');
        valid = false;
    }

    if (!validateEmail(email)) {
        setFieldError(`${prefix}-email`, `${prefix}-email-error`, 'Enter a valid email address');
        valid = false;
    }

    return valid;
}


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
            restoreNoContactsMessage();
            return;
        }

        const tbody = document.getElementById('contact-body');
        tbody.innerHTML = '';

        for(const contact of data.results){
            addRowToTable(
                contact.id,
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

document.getElementById('save-contact-btn').addEventListener('click', addContact);

document.getElementById('update-contact-btn').addEventListener('click', updateContact);

document.getElementById('update-contact').addEventListener('click', openUpdate);

//update contact visual
let selectedUpdate = null;

let updateMode = false;

function openUpdate(){
    if(deleteMode){
        deleteSelector();
    }

    if(!updateMode){
        updateMode = true;

        document.getElementById('table-header').style.display = '';

        document.querySelectorAll('.delete-column').forEach(function(column){
            column.style.display = '';
        });
        return; 
    }

    const checkedBoxes = document.querySelectorAll('.delete-checkbox:checked');

    if(checkedBoxes.length === 0){
        exitUpdateMode();
        return;
    } else if(checkedBoxes.length !== 1){
        alert('Select exactly one contact.');
        return;
    }

    const row = checkedBoxes[0].closest('tr');

    selectedUpdate = row;

    document.getElementById('update-firstname').value = row.children[1].textContent;
    document.getElementById('update-lastname').value = row.children[2].textContent;
    document.getElementById('update-phone').value = row.children[3].textContent;
    document.getElementById('update-email').value = row.children[4].textContent;

    closeAll();

    document.getElementById('update-choice').style.display = 'flex';
}

function exitUpdateMode(){
    updateMode = false;
    selectedUpdate = null;

    document.getElementById('table-header').style.display = 'none';

    document.querySelectorAll('.delete-column').forEach(function(column){
            column.style.display = 'none';
    });

    document.querySelectorAll('.delete-checkbox').forEach(function(box){
            box.checked = false;
    });
}

function closeAll(){
    ['add-choice', 'update-choice', 'confirm-delete-popup'].forEach(function(id) {
        document.getElementById(id).style.display = 'none';
    });

    // Clear validation state on close
    ['add', 'update'].forEach(function(prefix) {
        clearFieldError(`${prefix}-phone`, `${prefix}-phone-error`);
        clearFieldError(`${prefix}-email`, `${prefix}-email-error`);
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
    button.addEventListener('click', function(){
        closeAll();

        if(updateMode){
            exitUpdateMode();
        }
    });
});

//save contact button
//document.querySelector('.action-save').addEventListener('click', addContact);

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

    // Validate phone and email format
    if (!validateContactFields('add')) return;

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
            addRowToTable(data.id, firstName, lastName, phoneNumber, emailAddress);
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

//handles updating contact and related popup
async function updateContact(){
    const firstName = document.getElementById('update-firstname').value.trim();
    const lastName = document.getElementById('update-lastname').value.trim();
    const phoneNumber = document.getElementById('update-phone').value.trim();
    const emailAddress = document.getElementById('update-email').value.trim();

    if(!selectedUpdate){
        alert('No contact selected.');
        return;
    }
    
    // Validate phone and email format
    if (!validateContactFields('update')) return;

    const contactId = selectedUpdate.dataset.contactId;

    //API call 
    const updateData = {
        contactId: contactId,
        firstName: firstName,
        lastName: lastName,
        phone: phoneNumber,
        email: emailAddress,
        userId: userId
    };

    try{
        const response = await fetch("/api/UpdateContact.php", {
            method: "POST",
            headers: {
                "Content-Type": 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        const data = await response.json();

        console.log(data);

        if(data.contactId > 0){
            selectedUpdate.children[1].textContent = firstName;
            selectedUpdate.children[2].textContent = lastName;
            selectedUpdate.children[3].textContent = phoneNumber;
            selectedUpdate.children[4].textContent = emailAddress;

            selectedUpdate = null;

            exitUpdateMode();

            closeAll();
        } else{
            alert(data.error);
        }
    } catch(error){
        console.log("Update Contact Error:", error);
        alert(error.message);
    }
}

//handles selecting and deleting contacts
document.getElementById('delete-contact').addEventListener('click', deleteSelector);
document.getElementById('confirm-delete').addEventListener('click', openDeletePopup);
document.querySelector('.action-delete').addEventListener('click', deleteContact);

function deleteSelector(){
    if(updateMode){
        exitUpdateMode();
    }

    deleteMode = !deleteMode;

    const deleteButton = document.getElementById('delete-contact');
    const confirmButton = document.getElementById('confirm-delete');
    const deleteBar = document.getElementById('delete-bar');
    const tableHeader = document.getElementById('table-header');
    const deleteColumns = document.querySelectorAll('.delete-column');

    if(deleteMode){
        deleteButton.classList.add('active');
        confirmButton.style.display = 'inline-block';
        deleteBar.style.display = 'block';
        tableHeader.style.display = '';
        deleteColumns.forEach(function(column){
            column.style.display = '';
        });

    }
    else{
        deleteButton.classList.remove('active');
        confirmButton.style.display = 'none';
        deleteBar.style.display = 'none';
        tableHeader.style.display = 'none';
        deleteColumns.forEach(function(column){
            column.style.display = 'none';
        });
        document.querySelectorAll('.delete-checkbox')
            .forEach(function(box){
                box.checked = false;
            });
    }
}

function openDeletePopup(){
    const selectedRows = document.querySelectorAll('.delete-checkbox:checked');

    if(selectedRows.length === 0){
        alert('Select at least one contact.');
        return;
    }

    const names = [];

    selectedRows.forEach(function(box){

        const row = box.closest('tr');

        const firstName = row.children[1].textContent;

        const lastName = row.children[2].textContent;

        names.push(firstName + ' ' + lastName);
    });

    document.getElementById('selected-names')
        .textContent = names.join(', ');

    document.getElementById('confirm-delete-popup').style.display = 'flex';
}

async function deleteContact(){
    const selectedRows = document.querySelectorAll(
            '.delete-checkbox:checked'
    );

    try{
        for(const checkbox of selectedRows){
            const row = checkbox.closest('tr');

            const contactId = row.dataset.contactId;

            const response = await fetch('/api/DeleteContact.php',{
                method: 'POST',
                headers: {
                    'Content-Type':
                    'application/json'
                },
                body: JSON.stringify({
                    contactId: contactId,
                    userId: userId
                })
            });

            const data = await response.json();

            if(data.error){
                alert(data.error);
                continue;
            }
            row.remove();
        }

        closeAll();

        if(deleteMode){
            deleteSelector();
        }

        //restoreNoContactsMessage();
    }
    catch(error){
        console.error('Delete Contact Error:', error);
        alert(error.message);
    }
}

//helper for restoring empty contact table
function restoreNoContactsMessage(){
    const tbody = document.getElementById('contact-body');

    tbody.innerHTML = 
        `
        <tr>
            <td colspan="5">
                No contacts found
            </td>
        </tr>
    `;
}

/***** helper functions *****/
function addRowToTable(contactId, firstName, lastName, phoneNumber, emailAddress){
    const tbody = document.getElementById('contact-body');
    if(tbody.children.length === 1 && tbody.children[0].textContent.includes('No contacts found')){
        tbody.innerHTML = '';
    }

    const tr = document.createElement('tr');

    tr.dataset.contactId = contactId;

    tr.innerHTML = 
        '<td class="delete-column" style="display:none;">' + '<input type="checkbox" class="delete-checkbox">' + '</td>' +
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

//search contact logic
//document.getElementById().addEventListener('click', searchContact);
document.getElementById('search-form').addEventListener('submit', function(e){
    e.preventDefault();
    searchContact();
});

async function searchContact(){
    const searchInput = document.getElementById('searchContact').value.trim();

    if(!searchInput){
        loadContacts();
        return;
    }

    try{
        const response = await fetch("/api/SearchContact.php", {
            method: "POST",
            headers: {
                "Content-Type": 'application/json'
            },
            body: JSON.stringify({
                search: searchInput,
                userId: userId
            })
        });

        const data = await response.json();

        console.log(data);

        if(data.error){
            restoreNoContactsMessage(); 
        } else{
            renderContacts(data.results);
        }
    } catch(error){
        console.error('Search Contact Error:', error);
        alert("Search failed. Please try again.");
    }
}

function renderContacts(contacts){
    const tbody = document.getElementById('contact-body');
    tbody.innerHTML = ''; // clear existing rows

    if (contacts.length === 0) {
        restoreNoContactsMessage();
        return;
    }

    contacts.forEach(function(contact) {
        addRowToTable(
            contact.id,
            contact.firstName,
            contact.lastName,
            contact.phone,
            contact.email
        );
    });
}