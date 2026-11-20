/* Motion layer for the Rihlah Saeedah concept. Loaded with defer on every page. */
(function(){
  var doc=document.documentElement;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.__animReady=true;
  if(reduce){doc.classList.remove('anim');return;}
  doc.classList.add('anim');

  /* split hero headings into words that rise in */
  document.querySelectorAll('.hero h1,.phero h1').forEach(function(h){
    var words=h.textContent.trim().split(/\s+/);
    h.textContent='';
    words.forEach(function(w,i){
      var o=document.createElement('span');o.className='w';
      var s=document.createElement('span');s.textContent=w;s.style.setProperty('--i',i);
      o.appendChild(s);h.appendChild(o);
      if(i<words.length-1)h.appendChild(document.createTextNode(' '));
    });
    h.setAttribute('aria-label',words.join(' '));
    h.classList.add('wsplit');
  });

  /* mark things to reveal; siblings get a stagger */
  var groups=[
    ['.head','rv'],['.trust .in>div','rv'],['.tier','rv'],['.inc','rv'],['.step','rv'],
    ['.review','rv'],['.svc>a','rv'],['#visit details','rv-l'],['.visit','rv-s'],['.quick','rv-s'],
    ['.itin','rv'],['.formcard','rv'],['.contact-grid>aside','rv-s'],['.split>*','rv'],
    ['.final .in>*','rv'],['table.prices','rv'],['.social','rv'],['.lists>*','rv'],['.ticks','rv'],
    ['.compare-row,.cmp','rv']
  ];
  var seen=new Set();
  groups.forEach(function(g){
    document.querySelectorAll(g[0]).forEach(function(el){
      if(seen.has(el)||el.closest('.hero,.phero'))return;
      seen.add(el);el.classList.add(g[1]);
      var sibs=Array.prototype.filter.call(el.parentNode.children,function(c){return c.matches(g[0]);});
      var i=sibs.indexOf(el);
      if(i>0)el.style.setProperty('--d',(Math.min(i,6)*0.09)+'s');
    });
  });
  document.querySelectorAll('.timeline').forEach(function(t){
    t.querySelectorAll('li').forEach(function(li,i){li.style.setProperty('--i',i);});
  });

  /* count prices up from a lower figure when they come into view */
  var priceSel='.tier .price b,.itin-price b,.from strong,.facts b';
  var prices=[];
  document.querySelectorAll(priceSel).forEach(function(b){
    var m=b.textContent.trim().match(/^(SAR\s)([\d,]+)$/);
    if(!m)return;
    var end=parseInt(m[2].replace(/,/g,''),10);
    b.dataset.end=end;b.dataset.pre=m[1];
    b.style.fontVariantNumeric='tabular-nums';
    prices.push(b);
  });
  function fmt(n){return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,',');}
  function countUp(b){
    if(b.dataset.done)return;b.dataset.done=1;
    var end=+b.dataset.end,start=Math.round(end*0.72/100)*100,t0=null,dur=1400;
    function step(t){
      if(!t0)t0=t;var p=Math.min((t-t0)/dur,1);var e=1-Math.pow(1-p,4);
      b.textContent=b.dataset.pre+fmt(Math.round((start+(end-start)*e)/100)*100);
      if(p<1)requestAnimationFrame(step);else b.textContent=b.dataset.pre+fmt(end);
    }
    requestAnimationFrame(step);
  }

  /* one observer for everything */
  var targets=document.querySelectorAll('.rv,.rv-l,.rv-s,.timeline');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting)return;
        en.target.classList.add('is-in');io.unobserve(en.target);
      });
    },{rootMargin:'0px 0px -8% 0px',threshold:0.12});
    targets.forEach(function(t){io.observe(t);});
    var pio=new IntersectionObserver(function(entries){
      entries.forEach(function(en){if(en.isIntersecting){countUp(en.target);pio.unobserve(en.target);}});
    },{threshold:0.6});
    prices.forEach(function(b){pio.observe(b);});
  }else{
    targets.forEach(function(t){t.classList.add('is-in');});
  }

  /* scroll progress + header depth */
  var bar=document.createElement('div');bar.className='progress';bar.setAttribute('aria-hidden','true');
  document.body.appendChild(bar);
  var hdr=document.querySelector('header.top'),ticking=false;
  function onScroll(){
    ticking=false;
    var max=doc.scrollHeight-innerHeight;
    bar.style.transform='scaleX('+(max>0?Math.min(scrollY/max,1):0)+')';
    if(hdr)hdr.classList.toggle('scrolled',scrollY>12);
  }
  addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll);}},{passive:true});
  onScroll();

  /* cursor light in green bands, and a gentle 3D tilt on the hero card */
  var fine=matchMedia('(hover: hover) and (pointer: fine)').matches;
  if(fine){
    document.querySelectorAll('.hero,.phero,.final').forEach(function(sec){
      sec.addEventListener('pointermove',function(e){
        var r=sec.getBoundingClientRect();
        sec.style.setProperty('--mx',(e.clientX-r.left)+'px');
        sec.style.setProperty('--my',(e.clientY-r.top)+'px');
      });
    });
    var card=document.querySelector('.hero-card');
    if(card){
      var hero=card.closest('.hero');
      hero.addEventListener('pointermove',function(e){
        var r=card.getBoundingClientRect();
        var x=(e.clientX-(r.left+r.width/2))/r.width,y=(e.clientY-(r.top+r.height/2))/r.height;
        x=Math.max(-1,Math.min(1,x));y=Math.max(-1,Math.min(1,y));
        card.style.transform='perspective(900px) rotateY('+(x*6)+'deg) rotateX('+(-y*6)+'deg)';
      });
      hero.addEventListener('pointerleave',function(){card.style.transform='';});
    }
  }
})();
