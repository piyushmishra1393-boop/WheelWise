(function(){
  const KEY='wheelwiseDarkMode';
  const saved=localStorage.getItem(KEY)==='true';
  document.body.classList.toggle('dark',saved);
  let btn=document.getElementById('themeButton')||document.querySelector('.ww-theme-toggle');
  if(!btn){btn=document.createElement('button');btn.type='button';btn.className='ww-theme-toggle';btn.setAttribute('aria-label','Toggle dark mode');btn.title='Toggle dark mode';document.body.appendChild(btn);}
  function paint(){const dark=document.body.classList.contains('dark');btn.innerHTML=dark?'☀':'☾';btn.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');btn.title=dark?'Switch to light mode':'Switch to dark mode';}
  paint();
  btn.addEventListener('click',function(){const dark=!document.body.classList.contains('dark');document.body.classList.toggle('dark',dark);localStorage.setItem(KEY,String(dark));paint();});
})();
