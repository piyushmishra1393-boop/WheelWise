"use strict";
const byId=id=>document.getElementById(id);
function card(title,desc,href,label){const el=document.createElement("article");el.className="content-card";const h=document.createElement("h2");h.textContent=title||"Untitled";const p=document.createElement("p");p.textContent=desc||"";const a=document.createElement("a");a.href=href;a.textContent=label||"Read more →";el.append(h,p,a);return el;}
function videoCard(v){const el=document.createElement("article");el.className="content-card";const id=v.youtube_id;const frame=document.createElement("iframe");frame.src="https://www.youtube-nocookie.com/embed/"+encodeURIComponent(id);frame.title=v.title||"YouTube video";frame.loading="lazy";frame.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";frame.allowFullscreen=true;const h=document.createElement("h2");h.textContent=v.title||"Video";const d=document.createElement("p");d.textContent=v.description||"";el.append(frame,h,d);return el;}
async function initBrands(){const grid=byId("brandGrid");const brands=await WheelWiseAPI.loadBrands();grid.replaceChildren();if(!brands.length){grid.textContent="No brands have been added yet.";return;}brands.forEach(b=>{const el=document.createElement("article");el.className="brand-card";const h=document.createElement("h2");h.textContent=b.name;const d=document.createElement("p");d.textContent=b.description||"Explore stories and videos.";const a=document.createElement("a");a.href="brand.html?slug="+encodeURIComponent(b.slug);a.textContent="Explore brand →";el.append(h,d,a);grid.append(el);});}
async function initBrandPage(){const slug=new URLSearchParams(location.search).get("slug");const brands=await WheelWiseAPI.loadBrands();const brand=brands.find(b=>b.slug===slug);if(!brand){byId("brandTitle").textContent="Brand not found";return;}byId("brandTitle").textContent=brand.name;byId("brandDescription").textContent=brand.description||"";let tab="articles";const show=async()=>{const box=byId("brandContent");box.replaceChildren();if(tab==="articles"){const rows=await WheelWiseAPI.loadArticles();const items=rows.filter(a=>String(a.brand_id||"")===String(brand.id)||String(a.brand||"").toLowerCase()===brand.name.toLowerCase());items.forEach(a=>box.append(card(a.title,a.description,"article.html?id="+encodeURIComponent(a.id))));if(!items.length)box.textContent="No published articles for this brand yet.";}else{const rows=await WheelWiseAPI.loadVideos();const items=rows.filter(v=>String(v.brand_id||"")===String(brand.id)||String(v.brand_name||"").toLowerCase()===brand.name.toLowerCase());items.forEach(v=>box.append(videoCard(v)));if(!items.length)box.textContent="No published videos for this brand yet.";}};document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{tab=b.dataset.tab;document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));show().catch(e=>byId("brandContent").textContent=e.message);}));await show();}
async function initReviews(){let videos=await WheelWiseAPI.loadVideos("reviews");const box=byId("videoGrid");function render(){const q=(byId("videoSearch").value||"").toLowerCase();box.replaceChildren();const found=videos.filter(v=>(v.title+" "+v.description+" "+(v.brand_name||"")).toLowerCase().includes(q));found.forEach(v=>box.append(videoCard(v)));if(!found.length)box.textContent="No matching review videos found.";}byId("videoSearch").addEventListener("input",render);render();}
async function initCompare(){let tab="articles";const show=async()=>{const box=byId("compareContent");box.replaceChildren();if(tab==="articles"){const rows=(await WheelWiseAPI.loadArticles()).filter(a=>String(a.category||"").toLowerCase().includes("comparison"));rows.forEach(a=>box.append(card(a.title,a.description,"article.html?id="+encodeURIComponent(a.id))));if(!rows.length)box.textContent="No comparison articles published yet.";}else{const rows=await WheelWiseAPI.loadVideos("comparison");rows.forEach(v=>box.append(videoCard(v)));if(!rows.length)box.textContent="No comparison videos published yet.";}};document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{tab=b.dataset.tab;document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));show().catch(e=>byId("compareContent").textContent=e.message);}));await show();}

async function initHomeBrands(){
 const grid=byId("homeBrandGrid");
 if(!grid) return;
 const brands=await WheelWiseAPI.loadBrands();
 grid.replaceChildren();
 if(!brands.length){grid.textContent="No brands have been added yet.";return;}
 brands.forEach(b=>{
  const el=document.createElement("a");
  el.className="brand-card";
  el.href="brand.html?slug="+encodeURIComponent(b.slug);
  const mark=document.createElement("strong");
  mark.textContent=(b.name||"W").trim().charAt(0).toUpperCase();
  const name=document.createElement("span");name.textContent=b.name;
  el.append(mark,name);grid.append(el);
 });
}
async function initHomeSlides(){
 const slider=byId("heroSlider");
 if(!slider) return;
 try{
  const rows=await WheelWiseAPI.loadHomepageSlides();
  if(!rows.length) return; // Keep the original designed slides as a safe fallback.
  slider.replaceChildren();
  rows.forEach((row,i)=>{
   const slide=document.createElement("div");slide.className="hero-slide"+(i===0?" active":"");
   const img=document.createElement("img");img.src=WheelWiseAPI.safeImageUrl(row.image_url);img.alt=row.title||"WheelWise vehicle";img.loading="lazy";
   const label=document.createElement("div");label.className="hero-image-text";label.textContent=row.title||"Explore the road";
   slide.append(img,label);slider.append(slide);
  });
  const dotsWrap=document.querySelector(".slider-dots");
  if(dotsWrap){
   dotsWrap.replaceChildren();
   rows.forEach((row,i)=>{const dot=document.createElement("button");dot.className="dot"+(i===0?" active":"");dot.dataset.slide=String(i);dot.setAttribute("aria-label","Show slide "+(i+1));dot.addEventListener("click",()=>showDynamicSlide(i));dotsWrap.append(dot);});
  }
  let active=0;
  function showDynamicSlide(index){
   const slides=slider.querySelectorAll(".hero-slide"),dots=dotsWrap?dotsWrap.querySelectorAll(".dot"):[];
   if(!slides.length)return;active=(index+slides.length)%slides.length;
   slides.forEach((x,i)=>x.classList.toggle("active",i===active));
   dots.forEach((x,i)=>x.classList.toggle("active",i===active));
  }
  if(rows.length>1)setInterval(()=>showDynamicSlide(active+1),5000);
 }catch(err){console.warn("Homepage slides:",err);}
}

(async()=>{try{if(byId("homeBrandGrid"))await initHomeBrands();await initHomeSlides();if(byId("brandGrid"))await initBrands();if(byId("brandTitle"))await initBrandPage();if(byId("videoGrid"))await initReviews();if(byId("compareContent"))await initCompare();}catch(e){const target=byId("brandGrid")||byId("brandContent")||byId("videoGrid")||byId("compareContent");if(target)target.textContent="Unable to load content: "+e.message;console.error(e);}})();
