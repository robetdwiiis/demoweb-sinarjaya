
(function() {
  const originalFetch = window.fetch;
  window.fetch = async function(url, options) {
    if (typeof url !== 'string' || !url.includes('api/')) {
      return originalFetch.apply(this, arguments);
    }
    
    console.log('[API MOCK] Intercepted:', url, options);
    const jsonResponse = (data, status=200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
    
    let path = url;
    let params = {};
    if (url.includes('?')) {
        const parts = url.split('?');
        path = parts[0];
        const searchParams = new URLSearchParams(parts[1]);
        for(let [k,v] of searchParams.entries()) params[k] = v;
    }
    
    let bodyData = {};
    if (options && options.body && typeof options.body === 'string') {
        try { bodyData = JSON.parse(options.body); } catch(e){}
    }
    
    await new Promise(r => setTimeout(r, 200));
    
    if (path.includes('auth.php')) {
      let isActionLogin = bodyData.action === 'login';
      if (params.action === 'check') {
        const loggedIn = sessionStorage.getItem('admin_logged_in') === 'true';
        return jsonResponse({ is_logged_in: loggedIn, success: loggedIn, user: { name: 'Admin', role: 'admin' } });
      }
      if (params.action === 'logout' || bodyData.action === 'logout' || url.includes('action=logout')) {
        sessionStorage.removeItem('admin_logged_in');
        return jsonResponse({ success: true, message: 'Logout berhasil' });
      }
      if (isActionLogin || (options && options.method === 'POST')) {
        sessionStorage.setItem('admin_logged_in', 'true');
        return jsonResponse({ success: true, message: 'Login berhasil' });
      }
    }
    
    if (path.includes('dashboard.php')) {
        return jsonResponse({ success: true, data: { unread_messages: 0, low_stock_count: 0 } });
    }
    
    if (path.includes('products.php')) {
      let products = [];
      try {
          const d = localStorage.getItem('products');
          if (d) products = JSON.parse(d);
          else if (window.SinarJayaData && window.SinarJayaData.products) products = window.SinarJayaData.products;
      } catch(e){}
      if (options && (options.method === 'POST' || options.method === 'PUT')) {
         if (bodyData.id) {
            const idx = products.findIndex(p => p.id == bodyData.id);
            if (idx >= 0) products[idx] = { ...products[idx], ...bodyData };
         } else {
            bodyData.id = Date.now().toString();
            bodyData.createdAt = new Date().toISOString();
            products.push(bodyData);
         }
         localStorage.setItem('products', JSON.stringify(products));
         return jsonResponse({ success: true, message: 'Produk berhasil disimpan', data: bodyData });
      }
      if (options && options.method === 'DELETE') {
         products = products.filter(p => p.id != params.id);
         localStorage.setItem('products', JSON.stringify(products));
         return jsonResponse({ success: true, message: 'Produk dihapus' });
      }
      if (params.category) products = products.filter(p => p.category === params.category);
      if (params.featured === '1') products = products.filter(p => p.featured);
      if (params.limit) products = products.slice(0, parseInt(params.limit));
      
      return jsonResponse({ success: true, data: products, total: products.length });
    }
    
    if (path.includes('settings.php')) {
      return jsonResponse({ success: true, data: window.SinarJayaData ? window.SinarJayaData.company : {} });
    }
    
    if (path.includes('testimonials.php')) {
      let tests = [];
      try {
          const d = localStorage.getItem('testimonials');
          if(d) tests = JSON.parse(d);
      } catch(e){}
      return jsonResponse({ success: true, data: tests });
    }
    
    if (path.includes('upload.php')) {
      return jsonResponse({ success: true, filepath: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', message: 'Upload mock successful' });
    }
    
    if (path.includes('contact.php')) {
      if (options && options.method === 'POST' || options && options.method === 'PUT') {
         return jsonResponse({ success: true, message: 'Operasi berhasil!' });
      }
      return jsonResponse({ success: true, data: [] });
    }
    
    if (path.includes('stock-history.php')) {
      let sh = [];
      try {
          const d = localStorage.getItem('stockHistory');
          if(d) sh = JSON.parse(d);
      } catch(e){}
      return jsonResponse({ success: true, data: sh });
    }
    
    if (path.includes('users.php')) {
      return jsonResponse({ success: true, data: [{id: 1, name: 'Admin', username: 'admin', role: 'admin'}] });
    }
    
    return jsonResponse({ success: true, data: {}, message: 'Mock API fallback' });
  };
})();

