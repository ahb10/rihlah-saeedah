/* Full-screen mobile menu. Builds itself from the page's main nav, so every page stays in sync.
   Works on English pages and on the Urdu pages in ur/ (html lang="ur"). */
(function(){
  var hdr=document.querySelector('header.top'),nav=document.querySelector('nav.main');
  if(!hdr||!nav)return;
  var actions=hdr.querySelector('.hdr-actions')||hdr.querySelector('.in');
  var ur=document.documentElement.lang==='ur';
  var T=ur?{
    wa:'https://wa.me/923328886878?text='+encodeURIComponent('السلام علیکم، مجھے حج 2027 پیکجز کی تفصیلات چاہئیں۔'),
    home:'ہوم',pk:'حج 2027 پیکجز',msg:'واٹس ایپ پر پیغام بھیجیں',reply:'ہم 24/7 جواب دیتے ہیں',
    office:'دفتر: F-7 مرکز، اسلام آباد · پیر تا ہفتہ، صبح 9 سے شام 6',
    open:'مینو کھولیں',close:'مینو بند کریں',menu:'مینو',arrow:'←',tiers:['بجٹ','ایگزیکٹو','پلاٹینم'],
    subs:{'index.html':'یہاں سے شروع کریں','index.html#packages':'بجٹ، ایگزیکٹو اور پلاٹینم','umrah.html':'سارا سال، حرم کے قریب ہوٹل','transport.html':'گاڑیاں، زیارات اور فلائٹس','contact.html':'فارم اور دفتر کی معلومات'}
  }:{
    wa:'https://wa.me/923328886878?text=Assalam%20o%20Alaikum%2C%20I%20would%20like%20details%20of%20your%20Hajj%202027%20packages.',
    home:'Home',pk:'Hajj 2027 packages',msg:'Message us on WhatsApp',reply:'We reply 24/7',
    office:'Office: F-7 Markaz, Islamabad · Mon–Sat 9am–6pm',
    open:'Open menu',close:'Close menu',menu:'Menu',arrow:'→',tiers:['Budget','Executive','Platinum'],
    subs:{'index.html':'Start here','index.html#packages':'Budget, Executive and Platinum','umrah.html':'Year-round packages near Haram','transport.html':'Vehicles, guided Ziyarat and flights','contact.html':'Enquiry form and office details'}
  };
  var here=location.pathname.split('/').pop()||'index.html';

  var btn=document.createElement('button');
  btn.className='burger';btn.type='button';
  btn.setAttribute('aria-label',T.open);btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-controls','mmenu');
  btn.innerHTML='<span></span><span></span><span></span>';
  actions.appendChild(btn);

  var links=[{href:'index.html',text:T.home}];
  nav.querySelectorAll('a').forEach(function(a){links.push({href:a.getAttribute('href'),text:a.textContent});});

  var m=document.createElement('div');
  m.className='mmenu';m.id='mmenu';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-label',T.menu);
  var list=links.map(function(l,i){
    var cur=(l.href===here)?' aria-current="page"':'';
    return '<li style="--i:'+i+'"><a href="'+l.href+'"'+cur+'><small>'+String(i+1).padStart(2,'0')+'</small><span><b>'+l.text+'</b><em>'+(T.subs[l.href]||'')+'</em></span><i aria-hidden="true">'+T.arrow+'</i></a></li>';
  }).join('');
  m.innerHTML=
    '<div class="mm-in">'+
      '<ul class="mm-links">'+list+'</ul>'+
      '<div class="mm-pk" style="--i:'+links.length+'"><span>'+T.pk+'</span>'+
        '<a href="hajj-budget.html">'+T.tiers[0]+'<small>SAR 36,000</small></a>'+
        '<a href="hajj-executive.html">'+T.tiers[1]+'<small>SAR 39,000</small></a>'+
        '<a href="hajj-platinum.html">'+T.tiers[2]+'<small>SAR 47,800</small></a></div>'+
      '<div class="mm-foot" style="--i:'+(links.length+1)+'">'+
        '<a class="btn btn-wa mm-wa" target="_blank" rel="noopener" href="'+T.wa+'"><svg class="wa-ico"><use href="#wa"/></svg>'+T.msg+'<small>'+T.reply+'</small></a>'+
        '<div class="mm-meta"><a href="tel:+923328886878" dir="ltr">+92 332 8886878</a><span>'+T.office+'</span></div>'+
      '</div>'+
    '</div>';
  document.body.appendChild(m);

  var root=document.documentElement,lastFocus=null;
  function open(){
    var r=btn.getBoundingClientRect();
    m.style.setProperty('--cx',(r.left+r.width/2)+'px');m.style.setProperty('--cy',(r.top+r.height/2)+'px');
    m.style.setProperty('--top',Math.max(90,hdr.getBoundingClientRect().bottom+18)+'px');
    lastFocus=document.activeElement;
    m.scrollTop=0;root.classList.remove('mm-scrolled');
    root.classList.add('menu-open');btn.setAttribute('aria-expanded','true');btn.setAttribute('aria-label',T.close);
    setTimeout(function(){var f=m.querySelector('a');if(f)f.focus({preventScroll:true});},350);
  }
  function close(){
    root.classList.remove('menu-open','mm-scrolled');btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-label',T.open);
    if(lastFocus&&lastFocus.focus)lastFocus.focus({preventScroll:true});
  }
  /* frosted header once the menu's own content scrolls under the logo */
  m.addEventListener('scroll',function(){root.classList.toggle('mm-scrolled',m.scrollTop>4);},{passive:true});
  btn.addEventListener('click',function(){root.classList.contains('menu-open')?close():open();});
  m.addEventListener('click',function(e){if(e.target.closest('a'))close();});
  document.addEventListener('keydown',function(e){
    if(!root.classList.contains('menu-open'))return;
    if(e.key==='Escape'){close();return;}
    if(e.key==='Tab'){
      var f=[btn].concat(Array.prototype.slice.call(m.querySelectorAll('a')));
      var i=f.indexOf(document.activeElement);
      if(e.shiftKey&&i<=0){e.preventDefault();f[f.length-1].focus();}
      else if(!e.shiftKey&&i===f.length-1){e.preventDefault();f[0].focus();}
    }
  });
  matchMedia('(min-width: 981px)').addEventListener('change',function(q){if(q.matches)close();});
})();
