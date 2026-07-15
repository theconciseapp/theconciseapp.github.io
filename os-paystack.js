class OsPay {
  constructor(key) {
  	
    if (!key) throw new Error("Missing API key");
    

    this.key = key;
    this.baseUrl = sessionStorage.getItem('OsPaystackLocal')||"https://paystack.oshobby.com.ng/api";
  }

   toast( msg, type='danger'){
      	OsToast(msg, type);
   }
  // Main checkout function
  async checkout(options) {
    try {
    	
    if( JSON.stringify(options).length>10000 ){
    	throw new Error("Metadata too long");
    }
    
      if (!options.email) throw new Error("Missing Email");
      if (+options.amount < 150) throw new Error("Minimum amount is ₦150");

let headers={
	"Content-Type": "application/json"
	}

options.token=this.key;

 /*
if( location.href.startsWith('https') ){
	headers["Authorization"]=`Bearer ${this.key}`
headers["X-Auth-Token"] =this.key
   }else{
   	options.token=this.key;
}
*/

 options.domain=location.href;
 
 if (!navigator.onLine) {
 throw new Error("You're offline. Check your internet connection.");
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
      options.onError ? options.onError(err) : OsToast(err.message);
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

  // Validate origin
  const allowedOrigins = [
 this.baseUrl.replace('/paystack/api','')
];
alert( event.origin)
if (!allowedOrigins.includes(event.origin)) {
  return;
}

  // Ensure data is object
  if (!event.data || typeof event.data !== "object") {
    return;
  }

  const { type, reference, error_message } = event.data;

  if (!type) return;

  // Prevent duplicate events immediately
  window.removeEventListener("message", listener);

  try {

    switch (type) {

      case "payment_successful":
        await this._handleSuccess(reference, options);
        break;

      case "payment_cancelled":
        options.onClose?.(reference, error_message|| "Payment cancelled");
   
        this.emit('osp_payment_closed', { options, reference, error: (error_message||'Payment page closed') } );
        break;
case "payment_error":
        options.onError?.(reference, error_message||"Payment error occured");
        this.emit('osp_payment_error', { options, reference, error: (error_message||'Payment error') } );
        break;
      case "payment_failed":
        options.onFail?.(reference, error_message|| "Payment failed");
        this.emit('osp_payment_failed', { options, reference, error: ( error_message||'Payment failed' ) } );
        break;

      default:
        OsToast(
          "Unknown event from iframe",
          JSON.stringify(event.data)
        );
    }

  } catch (error) {
    console.error(error);

    options.onError?.(
      reference,
      error?.message || "An error occurred"
    );
this.emit('', 'osp_payment_error', { options, reference, error: (error.message||'An error occured') } );

  } finally {

    // Safely remove overlay
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }

  }
};

window.addEventListener("message", listener);
}
    

  // Private: Verified
  async _handleSuccess(reference, options) {
        options.onSuccess && options.onSuccess(reference);
        this.emit('osp_payment_successful', { options, reference} );
     } 
      
async verify(ref, callback){     
 const key=this.key;
	
	try{
    const res = await fetch(`${this.baseUrl}/verify?reference=${ref}`, {
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

// Custom event emitter (very useful)
    emit(eventName, detail) {
      document.dispatchEvent(new CustomEvent(eventName, {
            detail,
            bubbles: true
        }));
    }
    


async isReallyOnline() {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 3000); // 3 seconds

  try {
  const res= await fetch(`${this.baseUrl.replace('/api','')}/ping.php`, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal
    });

if (!res.ok) { // 404, 500, etc.
      // Treat as offline/unreachable
      return false;
    }

    clearTimeout(timeout);
    return true;
  } catch {
    return false;
    }
  } 
}


class OsLazyPaystackForm {

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

  if( typeof OsLazyCustomValidate==='function'){
  	const valid=OsLazyCustomValidate(form);
  if( !valid) return;
  }

        form.classList.add('was-validated');

        const formData = new FormData(form);
        const metadata = Object.fromEntries(formData.entries());

        const btn = form.querySelector('button');
        if (btn) btn.disabled = true;
        
        this.showMessage(form, "Initializing payment...", "info");

        try {
        	const logoUrl = metadata.logoUrl || '';
        	const custom_reference = metadata.reference || '';
        const webhookUrl = form.querySelector('.OsLazyPaystack-webhook-url').value;
            const email = metadata.email || '';
            const amount = Number(metadata.amount || 0);

            if (!email) {
                this.fail(form, "Enter a valid email address", btn);
                return;
            }

            if (amount < 150) {
                this.fail(form, "Amount must be at least ₦150", btn);
                return;
            }

            delete metadata.email;
            delete metadata.amount;
            delete metadata.reference;
            delete metadata.webhookUrl;
            
            const key = form.dataset.key || '';

            const popup = new OsPay(key);

            popup.checkout({
                email,
                amount,
                reference: custom_reference,
                webhook_url: webhookUrl,
                metadata,
                onClose: (reference, message) => {                  this.showMessage(form, 'Payment closed', 'info');
                    const cUrl= this.formatCallbackUrl( form.querySelector('.OsLazyPaystack-cancel-url').value, reference, 'cancelled');

           if( cUrl) {
     location.href=cUrl;
           return
           }
   },
      onSuccess: (reference) => {
      	this.showMessage(form, 'Payment successful', 'success');         
      
           const sUrl=  this.formatCallbackUrl( form.querySelector('.OsLazyPaystack-success-url').value, reference, 'success');
           
        if( sUrl)  {
     location.href=sUrl;
           return;
          }           
    },

   onFail: (reference, msg) => {
   	this.showMessage(form, msg, 'info');
               
 const fUrl= this.formatCallbackUrl( form.querySelector('.OsLazyPaystack-fail-url').value, reference, 'fail');
 
           if( fUrl) {
     location.href=fUrl;
           return
           }
},
               onError: (error) => {
                    this.showMessage(form,error.message);
                },
                always: () => {
                    this.cleanup(false, btn);
                }
            });

        } catch (e) {       
        	
            this.showMessage(form, e.message);
            this.cleanup(form, btn);
        }
    }

formatCallbackUrl(callbackUrl, reference='', extra=''){
   	if( !callbackUrl) return false;
   
    const url = new URL(callbackUrl, window.location.origin);
    url.searchParams.set('reference', reference);
 if( extra)   url.searchParams.set('osp_status', extra);
         
     return url.toString();
   }

 fail(form, message, btn) {
        this.showMessage(form, message);
        this.cleanup(false, btn);
    }

 showMessage(form, msg, type="danger"){
 	let message = msg;
 
 try{
 	
  if (msg.startsWith('TypeError')) {
    // Network-level error
    message = "Unable to connect. Check your internet or try again.";
  }

  if ( msg.startsWith('HTTP_')) {
    const status = parseInt(msg.message.split('_')[1]);

    if (status >= 500) {
      message = "Server error. Please try again later.";
    } else if (status === 404) {
      message = "Page not found.";
    } else if (status === 401 || status === 403) {
      message = "Unauthorized request.";
    } else if (status === 400) {
      message = "Invalid request.";
    }   
  }

   OsToast(message, type);
   }catch(e){
  OsToast( e.message); 
}
 	form.querySelector('.message').innerHTML=`<div class="alert alert-${type}">${message}</div>`;
 }

    cleanup(form, btn) {
      if( form){
      	
 const msg=form.querySelector('.message');
        msg.innerHTML = '';
        }
        if (btn) btn.disabled = false;      
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
    if( el.classList.contains('built')) return;
    
            try {

                const getData = (attr, fallback = '') =>(el.dataset[attr] || fallback);

                const split = (val) => val.toString().split('|');

                const options = {
                    key: split(getData('key')),
                    reference: split(getData('reference')),
                    title: split(getData('title')),
                    logo: split(getData('logoUrl', 'https://dummyimage.com/600x400/0079c6/fff&text=Os')),
                    amount: split(getData('amount')),
                    amountLabel: split(getData('amountLabel', 'Amount (₦)')),
                    email: split(getData('email')),
                    emailLabel: split(getData('emailLabel', 'Email address')),
                    fullname: split(getData('fullname', '|required')),
                    fullnameLabel: split(getData('fullnameLabel', 'Full name')),
                    submit: split(getData('submitBtn', 'Pay Now')),
                    successUrl: split(getData('successUrl')),
                    failUrl: split(getData('failUrl')),
                    cancelUrl: split(getData('cancelUrl')),
                    webhookUrl: split(getData('webhookUrl')),
                };

                const has = (arr, val) => arr.includes(val);

                const customFields = el.innerHTML.replace(/<os-loader.*>.*<\/os-loader>/,'');

  const osLazyForm = `
                <div class="container my-2">
                    <div class="card OsLazyPaystack-checkout-card shadow p-4">

                        <div class="OsLazyPaystack-logo-container ${options.logo.join(' ').match(/c:([^\s]+)/)?.[1]||''}">
                            <img src="${options.logo[0].trim()}">
                        </div>

                        <h4 class="text-center mb-3 ${options.title.join(' ').match(/c:([^\s]+)/)?.[1]||''}">${options.title[0].trim()}</h4>

                        <form class="OsLazyPaystackForm needs-validation" data-key="${options.key[0].trim()}" novalidate>
   <input type="text" name="logoUrl" value="${options.logo[0].trim()}" class="d-none">
                            <!-- Fullname -->
                            <div class="mb-3 ${has(options.fullname, 'hide') ? 'd-none' : ''}">
                                <label>${options.fullnameLabel[0].trim()}</label>
                                <input type="text"
                                    class="form-control OsLazyPaystack-fullname ${options.fullname.join(' ').match(/c:([^\s]+)/)?.[1]||''}"
                                    name="fullname"
                                    id="OsLazyPaystack-fullname-${pos}"
                                    value="${options.fullname[0].trim()}"
                                    ${has(options.fullname, 'required') ? 'required minlength="4"' : ''}
                                    ${has(options.fullname, 'readonly') ? 'readonly' : ''}>
                                <div class="invalid-feedback">Enter your full name</div>
                            </div>

                            <!-- Email -->
                            <div class="mb-3 ${has(options.email, 'hide') ? 'd-none' : ''}">
                                <label>${options.emailLabel[0].trim()}</label>
                                <input type="email"
                                    class="form-control OsLazyPaystack-email ${options.email.join(' ').match(/c:([^\s]+)/)?.[1]||''}"
                                    name="email"
                                    id="OsLazyPaystack-email-${pos}"
                                    value="${options.email[0].trim()}"
                                    required
                                    ${has(options.email, 'readonly') ? 'readonly' : ''}>
                                <div class="invalid-feedback">Enter a valid email address</div>
                            </div>

                            <!-- Amount -->
                            <div class="mb-3 ${has(options.amount, 'hide') ? 'd-none' : ''}">
                                <label>${options.amountLabel[0].trim()}</label>
                                <input type="number"
                                    class="form-control OsLazyPaystack-amount ${options.amount.join(' ').match(/c:([^\s]+)/)?.[1]||''}"
                                    name="amount"
                                    id="OsLazyPaystack-amount-${pos}"
                                    required
                                    min="${options.amount[1]||150}"
                                    value="${(options.amount[0]||'').trim()}"
                                    ${has(options.amount, 'readonly') ? 'readonly' : ''}>
                                <div class="invalid-feedback">Minimum amount is ₦${options.amount[1]||'150'}</div>
                            </div>
 
                            <div class="mb-3">
                                ${customFields}
                            </div>

                            <!-- Message -->
                            <div class="mt-3 message text-center"></div>
      <input class="OsLazyPaystack-reference" name="reference" type="hidden" value="${options.reference[0].trim()}">
                            <input class="OsLazyPaystack-success-url" type="hidden" value="${options.successUrl[0].trim()}">
                            <input class="OsLazyPaystack-fail-url" type="hidden" value="${options.failUrl[0].trim()}">
                            <input class="OsLazyPaystack-cancel-url" type="hidden" value="${options.cancelUrl[0].trim()}">
                            <input class="OsLazyPaystack-webhook-url" type="hidden" value="${options.webhookUrl[0].trim()}">

                            <!-- Submit -->
                            <button type="submit" class="btn btn-${(options.submit[1] || 'success').trim()} w-100">
                                ${options.submit[0]}
                            </button>
                        </form>
                      <div class="text-center mt-3 OsPaystackLocal"><small>Powered by Os Hub | Paystack</small></div>
                    </div>
                                     
                </div>
                `;
     el.innerHTML = osLazyForm; 
       el.classList.add('built');
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


(function () {
  function boot() {
    new OsLazyPaystackForm();
    
    sessionStorage.removeItem('OsPaystackLocal');
   
   let __osPLCnt=0;
   let __osPLTimer=null;
   
    const OsPaystackLocalBtn=document.querySelector('.OsPaystackLocal');

if( !OsPaystackLocalBtn) return;  
OsPaystackLocalBtn.addEventListener('click', function(){
    	if( !location.href.match(/localhost/) ) return;
    
    	__osPLCnt++;
    
    if( __osPLCnt>5){
    sessionStorage.setItem('OsPaystackLocal', 'http://localhost:8000/paystack/api');
    OsToast('Switched');
    
    // reset immediately after success
      __osPLCnt = 0;
      clearTimeout(__osPLTimer);
    }
    
 clearTimeout(__osPLTimer);

    __osPLTimer=setTimeout(function(){
    	__osPLCnt=0;
    }, 2000);
 });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (!(node instanceof Element)) return;

      const targets = [];

      if (node.matches('.OsLazyPaystack')) {
        targets.push(node);
      }

      targets.push(...node.querySelectorAll?.('.OsLazyPaystack') || []);

      targets.forEach((el) => {
        if (el.classList.contains('built')) return;

        const instance = new OsLazyPaystackForm();
        instance.build(el);
        el.classList.add('built');
      });
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});
