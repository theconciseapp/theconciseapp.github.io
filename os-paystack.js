class OsPay {
  constructor(key) {
  	
    if (!key) throw new Error("Missing API key");
    this.key = key;
    this.baseUrl = location.href.match(/localhosht/) ? "http://localhost:8080/paystack/api": "https://www.oshobby.com.ng/paystack/api";
  }

  // Main checkout function
  async checkout(options) {
    try {
      if (!options.email) throw new Error("Missing Email");
      if (+options.amount < 50) throw new Error("Minimum amount is ₦50");

let headers={
	"Content-Type": "application/json"
	}

if( location.href.startsWith('https') ){
	headers["Authorization"]=`Bearer ${this.key}`
headers["X-Auth-Token"] =this.key
   }else{
   	options.token=this.key;
}

      const res = await fetch(`${this.baseUrl}/initialize`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(options)
      });

      const result = await res.json();
      
      if (result.success || result.status) {
        const data = result.data;

        // Open iframe for payment
        this._openIframe(data.authorization_url, options);
        return;
      }

    throw new Error(result.message||"Unknown error");

    } catch (err) {
      options.onError ? options.onError(err) : OsToast(err);
    } finally{
    	options.always && options.always();
    }
  }

  // Private: Open payment in iframe
  _openIframe(url, options) {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.style = `
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    `;

    // Create iframe
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.style = `
      width: 500px;
      height: 600px;
      border: none;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    overlay.appendChild(iframe);
    document.body.appendChild(overlay);

  // ✅ Call onLoad once iframe fully loads
  iframe.onload = () => {
    options.onLoad && options.onLoad(iframe);
  };

    // Listen for postMessage events from iframe
    const listener = async (event) => {
      const { type, reference } = event.data || {};
      if (!type) return;

      switch(type) {
        case "payment_successful":
          await this._handleSuccess(reference, options);
          break;
        case "payment_cancelled":
          options.onClose && options.onClose(reference, "Payment cancelled");
          break;
        case "payment_failed":
          options.onFail && options.onFail( reference, "Payment failed");
          break;
        default:
          OsToast("Unknown event from iframe:", JSON.stringify(event.data) );
      }
      // Close overlay after any event
      document.body.removeChild(overlay);
      window.removeEventListener("message", listener);
    };

    window.addEventListener("message", listener);
  }

  // Private: Verified
  async _handleSuccess(reference, options) {
        options.onSuccess && options.onSuccess(reference);
      } 
      
async verify(ref, callback){     
 const key=this.key;
	
	try{
    const res = await fetch(`${this.baseUrl}/verify?token=${key}&reference=${ref}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const result = await res.json();
   if( result.success ) callback(result);
   else callback(null, result.message);
  
    }catch(err){
    	callback(null, err);
    }
      }      
}


class OsLazyPaystack {

    constructor(selector = '.OsLazyPaystackForm') {
        this.selector = selector;
        OsLazyPaystackFormBuild();
        this.init();
    }

    init() {
    	this.loadBootstrapCSS()
        document.addEventListener('submit', (e) => {
            const form = e.target;

            if (!form.matches(this.selector)) return;

            e.preventDefault();
            this.handleSubmit(form);
        });
        
document.addEventListener('input', (e) => {
    if (e.target.matches('.OsLazyPaystack-amount')) {
        let value = e.target.value;

        value = value.replace(/\D/g, '');
        value = value.replace(/^0+/, '');

        e.target.value = value;
    }
});
        
        
    }

    handleSubmit(form) {
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

  if( typeof lazyCustomValidate==='function'){
  	const valid=lazyCustomValidate(form);
  if( !valid) return;
  }

        form.classList.add('was-validated');

        const formData = new FormData(form);
        const metadata = Object.fromEntries(formData.entries());

        const btn = form.querySelector('button');
        if (btn) btn.disabled = true;
        
        this.showMessage(form, "Initializing payment...", "info");

        try {
            const email = metadata.email || '';
            const amount = Number(metadata.amount || 0);

            if (!email) {
                this.fail(form, "Enter a valid email address", btn);
                return;
            }

            if (amount < 50) {
                this.fail(form, "Amount must be at least ₦50", btn);
                return;
            }

            delete metadata.email;
            delete metadata.amount;

            const key = form.dataset.key || '';

            const popup = new OsPay(key);

            popup.checkout({
                email,
                amount,
                metadata,

                onClose: (reference) => {
                    this.emit(form, 'payment_close', {form, reference} );
                   this.showMessage(form, 'Payment closed', 'info');
                },
      onSuccess: (reference) => {
                this.emit(form, 'payment_success', {form, reference});
           const sUrl= form.querySelector('.OsLazyPaystack-success-url').value;
           if( sUrl) {
     location.href=sUrl + "?reference=" + reference;
           return
           }
this.showMessage(form, 'Payment successful', 'success');            
    },

                onFail: (reference, msg) => {
              this.emit(form, 'payment_fail', { form, reference, msg });
                const fUrl= form.querySelector('.OsLazyPaystack-fail-url').value;
           if( fUrl) {
     location.href=fUrl + "?" + reference;
           return
           }
          
     this.showMessage(form, msg, 'info');
},
               onError: (error) => {
                    this.showMessage(form,error);
                    this.emit(form, 'payment_error', {form, error});
                },
                always: () => {
                    this.cleanup(btn);
                }
            });

        } catch (e) {
            OsToast(e.message);
            this.cleanup(btn);
        }
    }

    fail(form, message, btn) {
        this.showMessage(form, message);
        this.cleanup(btn);
    }

 showMessage(form, message, type="danger"){
   OsToast(message, type);
   
 	form.querySelector('.message').innerHTML=`<div class="alert alert-${type}">${message}</div>`;
 }

    cleanup(btn) {
        const msg = document.getElementById('msg');
        if (msg) msg.innerHTML = '';
        if (btn) btn.disabled = false;
    }

    // Custom event emitter (very useful)
    emit(form, eventName, detail) {
        form.dispatchEvent(new CustomEvent(eventName, {
            detail,
            bubbles: true
        }));
    }
    
    loadBootstrapCSS() {
    // prevent duplicate loading
    if (window.__oslazy_bootstrap_css) return;

    const existing = document.querySelector('link[href*="bootstrap"]');

    if (existing) {
    	console.log('OsLazyPaystack: Bootstrap already exists');
        window.__oslazy_bootstrap_css = true;
        return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css';

    document.head.appendChild(link);
    window.__oslazy_bootstrap_css = true;
  }     
}


new OsLazyPaystack();


function OsLazyPaystackFormBuild() {

    const osLazyPaystack = document.querySelectorAll('.OsLazyPaystack');

    if (osLazyPaystack.length) {

        // Inject styles once
        if (!window.__oslazy_style_added) {
            const style = document.createElement('style');
            style.innerHTML = `
            .OsLazyPaystack-checkout-card {
                max-width: 500px;
                margin: 60px auto;
                border-radius: 15px;
            }
            .OsLazyPaystack-logo-container{
                width: 60px;
                height: 60px;
                overflow: hidden;
                border-radius: 50%;
                margin: 16px auto;
            }
            .OsLazyPaystack-logo-container img{
                width: 100%;
                height: 100%;
                object-fit: cover;
                object-position: center;
            }`;
            document.body.appendChild(style);
            window.__oslazy_style_added = true;
        }

        osLazyPaystack.forEach((el, pos) => {

            try {

                const getData = (attr, fallback = '') =>(el.dataset[attr] || fallback);

                const split = (val) => val.toString().split('|');

                const options = {
                    key: getData('key'),
                    title: split(getData('title')),
                    logo: split(getData('logo', 'https://dummyimage.com/600x400/000/fff&text=Os')),
                    amount: split(getData('amount')),
                    amountLabel: split(getData('amountLabel', 'Amount (₦)')),
                    email: split(getData('email')),
                    emailLabel: split(getData('emailLabel', 'Email address')),
                    fullname: split(getData('fullname', '|required')),
                    fullnameLabel: split(getData('fullnameLabel', 'Full name')),
                    submit: split(getData('submitBtn', 'Pay Now')),
                    successUrl: getData('successUrl'),
                    failUrl: getData('failUrl'),
                };

                const has = (arr, val) => arr.includes(val);

                const customFields = el.innerHTML;

                const osLazyForm = `
                <div class="container my-2">
                    <div class="card OsLazyPaystack-checkout-card shadow p-4">

                        <div class="OsLazyPaystack-logo-container">
                            <img src="${options.logo[0]}">
                        </div>

                        <h4 class="text-center mb-3">${options.title[0]}</h4>

                        <form class="OsLazyPaystackForm needs-validation" data-key="${options.key}" novalidate>

                            <!-- Fullname -->
                            <div class="mb-3 ${has(options.fullname, 'hide') ? 'd-none' : ''}">
                                <label>${options.fullnameLabel[0]}</label>
                                <input type="text"
                                    class="form-control OsLazyPaystack-fullname"
                                    name="fullname"
                                    id="OsLazyPaystack-fullname-${pos}"
                                    value="${options.fullname[0]}"
                                    ${has(options.fullname, 'required') ? 'required minlength="4"' : ''}
                                    ${has(options.fullname, 'fixed') ? 'readonly' : ''}>
                                <div class="invalid-feedback">Enter your full name</div>
                            </div>

                            <!-- Email -->
                            <div class="mb-3 ${has(options.email, 'hide') ? 'd-none' : ''}">
                                <label>${options.emailLabel[0]}</label>
                                <input type="email"
                                    class="form-control OsLazyPaystack-email"
                                    name="email"
                                    id="OsLazyPaystack-email-${pos}"
                                    value="${options.email[0]}"
                                    required
                                    ${has(options.email, 'fixed') ? 'readonly' : ''}>
                                <div class="invalid-feedback">Enter a valid email address</div>
                            </div>

                            <!-- Amount -->
                            <div class="mb-3 ${has(options.amount, 'hide') ? 'd-none' : ''}">
                                <label>${options.amountLabel[0]}</label>
                                <input type="number"
                                    class="form-control OsLazyPaystack-amount"
                                    name="amount"
                                    id="OsLazyPaystack-amount-${pos}"
                                    required
                                    min="50"
                                    value="${options.amount[0]}"
                                    ${has(options.amount, 'fixed') ? 'readonly' : ''}>
                                <div class="invalid-feedback">Minimum amount is ₦50</div>
                            </div>

                            <div class="mb-3">
                                ${customFields}
                            </div>

                            <!-- Message -->
                            <div class="mt-3 message text-center"></div>

                            <input class="OsLazyPaystack-success-url" type="hidden" value="${options.successUrl}">
                            <input class="OsLazyPaystack-fail-url" type="hidden" value="${options.failUrl}">

                            <!-- Submit -->
                            <button type="submit" class="btn btn-${options.submit[1] || 'success'} w-100">
                                ${options.submit[0]}
                            </button>

                        </form>
                      <div class="text-center mt-3"><small>Powered by Os | Paystack</small></div>  
                    </div>
                                     
                </div>
                `;

                el.innerHTML = osLazyForm;

            } catch (e) {
                OsToast(e.message);
            }

        });
    }
}


function OsToast(message, type = "danger") {
    let bg = "#d32f2f"; // danger (red)

    if (type === "success") bg = "#2e7d32";
    if (type === "info") bg = "#1976d2";
    if (type === "warning") bg = "#f57c00";

    // Create element
    const toast = document.createElement("div");
    toast.className = "custom-toast";
    toast.textContent = message;

    // Apply styles
    Object.assign(toast.style, {
        position: "fixed",
        bottom: "20vh",
        left: "50%",
        width: "90%",
        maxWidth: "280px",
        transform: "translateX(-50%)",
        background: bg,
        color: "#fff",
        padding: "10px 18px",
        borderRadius: "6px",
        zIndex: 9999,
        opacity: "0",
        fontSize: "14px",
        boxShadow: "0 4px 10px rgba(0,0,0,.2)",
        transition: "opacity 0.2s ease"
    });

    document.body.appendChild(toast);

    // Fade in
    requestAnimationFrame(() => {
        toast.style.opacity = "1";
    });

    // Stay for 3s, then fade out
    setTimeout(() => {
        toast.style.opacity = "0";

        // Remove after fade out
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}



/*
document.addEventListener('payment_close', function (e) {
	e.detail.reference;
    OsToast('Payment closed');
});

payment_success, payment_fail, payment_error

*/
