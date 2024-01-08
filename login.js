const form = document.getElementById('form');
const email = document.getElementById('email');
const password = document.getElementById('password');
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
    store.createIndex('email', 'email', { unique: false });
    console.log("openCreateDb: Index created on email");
    store.createIndex('password', 'password', { unique: false });
    console.log("openCreateDb: Index created on password");
     
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
    var email = document.getElementById("email");
    var password = document.getElementById("password");

    var isStandardUser = document.getElementById("isStandardUser").checked;

    var role = isStandardUser ? 'standard' : 'admin';

    var obj = { 
        email: email.value, 
        password: password.value, 
        role: role
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

        req.onerror = function (e) {
            console.error('loginUser: error', this.error);
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

form.addEventListener('submit', (e) => {
    e.preventDefault();

    addUser(db);
});