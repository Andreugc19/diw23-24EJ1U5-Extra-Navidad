const form = document.getElementById('form');
const firstname = document.getElementById('firstname');
const lastname = document.getElementById('lastname');
const email = document.getElementById('email');
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirmPassword');
let userAvatar;
var indexedDB = window.indexedDB || window.mozIndexedDB ||
window.webkitIndexedDB || window.msIndexedDB ||
window.shimIndexedDB;
var database = "usersDB";
const DB_STORE_NAME = 'users';
const DB_VERSION = 1;
var db;
var opened = false;

function openCreateDb(onDbCompleted) {
    if(opened){
        db.close();
        opened = false;
    }

    var req = indexedDB.open(database, DB_VERSION);

    req.onsuccess = function (e) {
        db = this.result;
        console.log("openCreateDb: Databased opened " + db);
        opened = true;

    };

    req.onupgradeneeded = function() {

    db = req.result;

    console.log("openCreateDb: upgrade needed " + db);
    var store = db.createObjectStore(DB_STORE_NAME, { keyPath: "id", autoIncrement: true});
    console.log("openCreateDb: Object store created");
    store.createIndex('firstname', 'firstname', { unique: false });
    console.log("openCreateDb: Index created on firstname");
    store.createIndex('lastname', 'lastname', { unique: false });
    console.log("openCreateDb: Index created on lastname");
    store.createIndex('email', 'email', { unique: false });
    console.log("openCreateDb: Index created on email");
    store.createIndex('password', 'password', { unique: false });
    console.log("openCreateDb: Index created on password");
    store.createIndex('confirmPassword', 'confirmPassword', { unique: false });
    console.log("openCreateDb: Index created on confirmPassword");
     
};

    req.onerror = function (e) {
        console.error("openCreateDb: error opening or creating DB:",
    e.target.errorCode);
    };

}

openCreateDb();

function sendData(){
    openCreateDb(function(db){
        var hiddenId = document.getElementById("hiddenId").value;
        if (hiddenId == 0){
            addUser(db);
        } else {
            console.log("change user values");
            editUser(db);
        }    
    });
}

function addUser(db){
    var firstname = document.getElementById("firstname");
    var lastname = document.getElementById("lastname");
    var email = document.getElementById("email");
    var password = document.getElementById("password");
    var confirmPassword = document.getElementById("confirmPassword");
    var hashedPassword = CryptoJS.MD5(password.value).toString();
    var hashedConfirmPassword = CryptoJS.MD5(confirmPassword.value).toString();
    var isStandardUser = document.getElementById("isStandardUser").checked;

    var role = isStandardUser ? 'standard' : 'admin';

    var obj = { 
        firstname: firstname.value, 
        lastname: lastname.value, 
        email: email.value, 
        password: hashedPassword, 
        confirmPassword: hashedConfirmPassword, 
        role: role,
        userAvatar: userAvatar
        };

    var tx = db.transaction(DB_STORE_NAME, "readwrite");
    var store = tx.objectStore(DB_STORE_NAME);

    try {
        req = store.add(obj);
    } catch (e) {
        console.log("Catch");
    }

    req.onsuccess = function (e) {
    console.log("addUser: Data insertion successfully done. Id: " + e.target.result);

        const userId = e.target.result;

        if (role === 'admin') {
            window.location.href = `admin.html?userId=${userId}`;
        } else {
            window.location.href = `standard.html?userId=${userId}`;
        }
    };  

    req.onerror = function(e) {
        console.error("addUser: error creating data", this.error);
    };

    tx.oncomplete = function() {
        console.log("addUser: transaction completed");
        db.close();
        opened = false;
    };
}

function radioValue(e) {
    userAvatar = e;
}

function readData(){
    openCreateDb(function(db){
      readUsers(db);
    });
}

function loginUser() {
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const isStandardUser = document.getElementById('isStandardUser').checked;

    const hashedPassword = CryptoJS.MD5(password.value).toString();
    const role = isStandardUser ? 'standard' : 'admin';

    openCreateDb(function (db) {
        var tx = db.transaction(DB_STORE_NAME, 'readonly');
        var store = tx.objectStore(DB_STORE_NAME);
        var index = store.index('email');

        var req = index.get(email.value);

        req.onsuccess = function (e) {
            var user = e.target.result;

            if (user && user.password === hashedPassword && user.role === role) {
                sessionStorage.setItem('userId', user.id);
                sessionStorage.setItem('userRole', role);

                if (role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'standard.html';
                }
            } else {
                alert('Error. Try again.');
            }
        };

        req.onsuccess = function (e) {
            var user = e.target.result;
        
            if (user && user.password === hashedPassword && user.role === role) {
                sessionStorage.setItem('userId', user.id);
                sessionStorage.setItem('userRole', role);
        
                // Muestra los datos del usuario en el formulario de configuración
                mostrarDatosUsuarioEnSettings(user);
        
            } else {
                alert('Error. Try again.');
            }
        };

        tx.oncomplete = function () {
            console.log('loginUser: complet transaction');
            db.close();
        };
    });
}

function logout() {
    window.location.href = "index.html";
}

function esObligatori(inputArray) {
    inputArray.forEach((input) => {
        if(input.value.trim() === '') {
            mostraError(input, `${premNomInput(input)} és obligatori`);
        } else {
            mostraCorrecte(input);
        }
    });
}

function comprovaLongitud(input, min, max) {
    if(input.value.length < min) {
        mostraError(input, `${premNomInput(input)} most have a minimum of ${min} characters`);
    } else if(input.value.length > max) {
        mostraError(input, `${premNomInput(input)} must be a minium of ${max} characters`);
    } else {
        mostraCorrecte(input);
    }
}

function esEmailValid(input) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if(re.test(input.value.trim())) {
        mostraCorrecte(input);
    } else {
       let missatge = `${premNomInput(input)} doesn't have the correct format`;
       mostraError(input, missatge);
    }
}

function comprovaContrasenyesSonIguals(input1, input2) {
    if(input1.value != input2.value) {
        let missatge = `${premNomInput(input2)} has to be equal to ${premNomInput(input1)}`;
        mostraError(input2, missatge);
    }
}

function esContrasenaSegura(input) {
    const contrasena = input.value;

    const regexUpperCase = /[A-Z]/;
    const regexLowerCase = /[a-z]/;
    const regexNumber = /[0-9]/;
    const regexSpecialChar = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/;

    if (
        !regexUpperCase.test(contrasena) ||
        !regexLowerCase.test(contrasena) ||
        !regexNumber.test(contrasena) ||
        !regexSpecialChar.test(contrasena) ||
        contrasena.length < 8
    ) {
        let mensaje = `The password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character`;
        mostraError(input, mensaje);
    } else {
        mostraCorrecte(input);
    }
}

function mostraError(input, missatge) {
    const formGroup = input.parentElement;
    formGroup.className = 'form-group error';
    const label = formGroup.querySelector('label');
    const small = formGroup.querySelector('small');
    small.innerText = missatge;
}

function mostraCorrecte(input) {
    const formGroup = input.parentElement;
    formGroup.className = 'form-group correcte';
}

function premNomInput(input) {
    return input.id.charAt(0).toUpperCase() + input.id.slice(1);
}

form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validación de campos
    const errors = [];

    esObligatori([firstname, lastname, email, password, confirmPassword]);

    comprovaLongitud(firstname, 3, 15);
    comprovaLongitud(lastname, 3, 15);
    comprovaLongitud(password, 8, 25);
    comprovaLongitud(confirmPassword, 8, 25);

    esEmailValid(email);

    esContrasenaSegura(password);
    esContrasenaSegura(confirmPassword);

    comprovaContrasenyesSonIguals(password, confirmPassword);

    // Si alguna función de validación ha agregado un mensaje de error al input,
    // se buscará ese mensaje y se agregará al array de errores.
    [firstname, lastname, email, password, confirmPassword].forEach(input => {
        const formGroup = input.parentElement;
        const small = formGroup.querySelector('small');
        if (small.innerText) {
            errors.push(small.innerText);
        }
    });

    // Si hay errores, muestra los mensajes debajo de cada campo.
    if (errors.length > 0) {
        errors.forEach(error => {
            // Aquí se busca el input correspondiente y se muestra el mensaje de error debajo.
            const input = document.querySelector(`#${error.split(' ')[0].toLowerCase()}`);
            const formGroup = input.parentElement;
            const small = formGroup.querySelector('small');
            small.innerText = error;
        });
        return; // Detiene la ejecución de la función aquí si hay errores.
    }

    // Si no hay errores, entonces puedes continuar con el proceso de registro.
    addUser(db);
});