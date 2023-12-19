        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
        import { getFirestore, collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc, setDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js";
        import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-auth.js"
        import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-storage.js";

        const firebaseConfig = {
            apiKey: "AIzaSyDtX4OWk4DBn5f_APfGcwiwI6qMXBCKfhk",
            authDomain: "myfireapp-8d543.firebaseapp.com",
            projectId: "myfireapp-8d543",
            storageBucket: "myfireapp-8d543.appspot.com",
            messagingSenderId: "484285304427",
            appId: "1:484285304427:web:54c53464c02f04a4646b2e"
        };

        //global
        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const auth = getAuth(app);
        const storage = getStorage(app);
        const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
        var userData = null;
        var loggedIn = null;

        // Function to check if the user is logged in
        function isUserLoggedIn() {
            return !!auth.currentUser;
        }

        //***********************************event listener**************************************
        // Add an event listener to the confirmation logout button
        confirmLogoutBtn.addEventListener("click", () => {
            signOut(auth)
                .then(() => {
                    // Redirect to the login page or perform any other actions
                    // console.log("User logged out successfully");
                    window.location.href = "login.html"; // Redirect to the login page
                })
                .catch((error) => {
                    console.error("Error during logout:", error);
                });
        });

        //************************cart dependency**********************************
        //update cart function cart(dependency)
        async function updateCart() {
            console.log("from update cart")
            const shownCart = document.querySelector('#shown-cart')

            if (loggedIn) {
                //get user data
                const userDoc = await getUserSnapshot(auth.currentUser.uid)
                const cartSnapshot = await getDocs(collection(userDoc.ref, 'cart'))

                if (cartSnapshot.empty) {
                    shownCart.style.display = 'none'
                    return
                }

                if (cartSnapshot.size >= 1) {
                    // console.log(cartItems)
                    shownCart.textContent = cartSnapshot.size
                    shownCart.style.display = 'block'
                }
            }
            else {
                if (!sessionStorage.getItem('cart')) {
                    shownCart.style.display = 'none'
                    return
                }
                else {
                    var cartList = JSON.parse(sessionStorage.getItem('cart'))
                    shownCart.textContent = cartList.length
                    shownCart.style.display = 'block'
                }
            }
        }

        //get user snapshot cart(dependency)
        function getUserSnapshot(uid) {
            const userRef = doc(firestore, 'users', uid)
            console.log('3')
            return new Promise((resolve, reject) => {
                resolve(getDoc(userRef))
            })
        }
        //************************************************************************

        //*****************************loading and role access************************************
        // Use onAuthStateChanged to control access to admin dashboard
        onAuthStateChanged(auth, (user) => {
            console.log("inside onAuth")
            console.log(user);
            if (user) {
                loggedIn = true
                onLoggedIn();
                // User is authenticated
                const docRef = doc(firestore, "users", user.uid);
                const docSnap = getDoc(docRef);
                docSnap.then((docSnapshot) => {
                    // console.log(docSnapshot)
                    if (docSnapshot.exists()) {
                        userData = docSnapshot.data();
                        console.log(userData)
                        roleAccess(userData.role);
                        updateCart();
                        stopLoader();
                        // console.log(userData)
                    }
                });
            } else {
                console.log("else ")
                // User is not authenticated, redirect to login page
                //set the loggedIn flag flase
                loggedIn = false
                // window.location.href = "login.html";
                onLoggedOut();
                updateCart();
                stopLoader();
            }
        });

        function roleAccess(role) {
            // console.log('inside role')
            const roleMap = new Map([
                ["ADMIN", "adminAppbar"],
                ["CUSTOMER", "customerAppbar"],
                ["AGENT", "agentAppbar"],
            ]);
            const appbarList = document.querySelectorAll(`#${roleMap.get(role)}`);
            appbarList.forEach((appbar) => {
                appbar.classList.remove("d-none");
            })
        }

        //to execut upon logging in
        function onLoggedIn() {
            var navItemList = document.querySelectorAll(".loggedIn");
            navItemList.forEach((navItem) => {
                navItem.style.display = "block";
            });

            navItemList = document.querySelectorAll(".loggedOut");
            navItemList.forEach((navItem) => {
                navItem.style.display = "none";
            });
        }

        //to execute upon logging out
        function onLoggedOut() {
            console.log("logout")
            var navItemList = document.querySelectorAll(".loggedOut");
            navItemList.forEach((navItem) => {
                navItem.style.display = "block";
            });

            navItemList = document.querySelectorAll(".loggedIn");
            navItemList.forEach((navItem) => {
                navItem.style.display = "none";
            });
        }

        //stop the loader show the main body
        function stopLoader() {
            document.querySelector('#overlay').classList.add('hidden');
            document.querySelector('#main').classList.remove('hidden');
        }

        //*************************************toast message**********************************
        //display message function
        function displayMessage(message, type) {
            // Get the toast container element
            const toastContainer = document.querySelector(".toast-container");

            // Create a clone of the toast template
            const toast = document.querySelector(".toast").cloneNode(true);

            // Set the success message
            toast.querySelector(".toast-body").textContent = message;

            //set text type  success/danger
            if (type === "danger") {
                toast.classList.remove("bg-success");
                toast.classList.add("bg-danger");
            } else {
                toast.classList.add("bg-success");
                toast.classList.remove("bg-danger");
            }

            // Append the toast to the container
            toastContainer.appendChild(toast);

            // Initialize the Bootstrap toast and show it
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();

            // Remove the toast after it's closed
            toast.addEventListener("hidden.bs.toast", function () {
                toast.remove();
            });
        }


        //*************************Validation**************************
        // Function to validate first name (minimum 3 characters)
        function isValidName(name) {
            return name.length >= 3;
        }

        //Function to validate email 
        function isValidEmail(email) {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailPattern.test(email);
        }

        // Function to validate phone number (must be exactly 10 digits)
        function isValidPhoneNumber(phone) {
            const phoneNumberRegex = /^\d{10}$/;
            return phoneNumberRegex.test(phone);
        }

        function isMessage(message) {
            return message.length >= 3;
        }

        // Function to display error messages
        function displayError(errorElementId, isValid, errorMessage) {
            const errorElement = document.getElementById(errorElementId);
            if (!isValid) {
                errorElement.textContent = errorMessage;
            } else {
                errorElement.textContent = "";
            }
        }
