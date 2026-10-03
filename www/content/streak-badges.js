/* Corpus · streak badges (Shield, option A)
 * Plain script, no modules: load it with a <script> tag before the main inline block, like content/*.js.
 * Exposes window.StreakBadges. Pure rendering only: no state, no storage, no date math.
 *
 *   StreakBadges.crest(tier, size, {off})   -> SVG string for one badge (tier 0..4)
 *   StreakBadges.flame(size)                -> SVG string for the existing streak flame icon (the stat-icon one)
 *   StreakBadges.miniFlame()                -> small white flame for the week dots
 *   StreakBadges.DAYS                       -> [1,3,7,30,100]
 *   StreakBadges.NAMES.en / .he             -> tier names
 *   StreakBadges.tierFor(days)              -> highest tier index reached for a run of `days`, or -1
 */
(function(){
  var OL='#2A1266';
  var DAYS=[1,3,7,30,100];
  var NAMES={en:['Spark','Ember','Blaze','Blue flame','Eternal flame'],he:['ניצוץ','גחלת','להבה','אש כחולה','אש תמיד']};
  /* flame colours per tier: [outer, inner, core]. The flame gets hotter: amber, coral, rose, blue, purple */
  var FLAMES=[['#F59E0B','#FFCF7A','#7B4FD4'],['#FF7A45','#FFCF7A','#FF6FA8'],['#FF6FA8','#FFD0E4','#7B4FD4'],['#4FB3F0','#D6F0FF','#7B4FD4'],['#9B6FE4','#F3E8FF','#F59E0B']];
  var SHIELD=[['#9B6FE4','#7B4FD4'],['#7B4FD4','#5E37A8'],['#5E37A8','#4A2A8F'],['#4A2A8F','#2A1266'],['#3A1F7A','#21104F']];
  var BANNER=['#F59E0B','#FF6FA8','#F59E0B','#7EC9F7','#F59E0B'];
  var TRIM=[null,'#FF9DC4','#FFCF7A','#7EC9F7','#F59E0B'];
  /* the existing streak icon paths (Corpus stat icons v4, viewBox 0 0 64 64) */
  var P={
    outer:'M32 6 C 26 14, 18 22, 18 34 C 18 46, 26 52, 32 52 C 38 52, 46 46, 46 34 C 46 26, 40 24, 38 18 C 36 22, 34 22, 34 18 C 34 14, 33 10, 32 6 Z',
    inner:'M32 16 C 28 22, 24 28, 24 38 C 24 46, 28 50, 32 50 C 36 50, 42 46, 42 38 C 42 30, 38 28, 36 22 C 35 24, 33 24, 33 22 C 33 18, 32 16, 32 16 Z',
    core:'M32 28 C 28 32, 27 38, 30 44 C 32 48, 36 46, 37 42 C 38 36, 35 32, 32 28 Z'
  };
  var SH='M60 16 C72 22 86 24 98 24 L98 60 C98 84 80 100 60 108 C40 100 22 84 22 60 L22 24 C34 24 48 22 60 16Z';
  var SH_IN='M60 24 C70 29 82 31 91 31 L91 60 C91 79 77 92 60 99 C43 92 29 79 29 60 L29 31 C38 31 50 29 60 24Z';

  function flameGroup(t,off){
    var c=off?['#F1ECFA','#F1ECFA','#E4DAF3']:FLAMES[t], ol=off?'#CDBFE6':OL;
    return '<g class="'+(off?'':'sk-flick')+'">'+
      '<path d="'+P.outer+'" fill="'+c[0]+'" stroke="'+ol+'" stroke-width="2.2" stroke-linejoin="round"/>'+
      (off?'':'<path d="'+P.inner+'" fill="'+c[1]+'"/>')+
      '<path d="'+P.core+'" fill="'+c[2]+'" stroke="'+ol+'" stroke-width="1.4" stroke-linejoin="round"/>'+
      (off?'':'<path d="M30 34 Q 32 38 30 42" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M32 9 Q 33 14 32 18" stroke="#FFF7E0" stroke-width="1.2" fill="none" stroke-linecap="round"/>')+
    '</g>';
  }
  function star4(x,y,r,fill){
    return '<path d="M'+x+' '+(y-r)+' Q'+(x+r*.18)+' '+(y-r*.18)+' '+(x+r)+' '+y+' Q'+(x+r*.18)+' '+(y+r*.18)+' '+x+' '+(y+r)+' Q'+(x-r*.18)+' '+(y+r*.18)+' '+(x-r)+' '+y+' Q'+(x-r*.18)+' '+(y-r*.18)+' '+x+' '+(y-r)+'Z" fill="'+fill+'" stroke="'+OL+'" stroke-width="1.2" stroke-linejoin="round"/>';
  }
  function crest(t,size,opts){
    var off=!!(opts&&opts.off), ol=off?'#CDBFE6':OL, sh=off?['#ECE5F7','#E2D8F2']:SHIELD[t];
    var fs=[1.0,1.08,1.14,1.18,1.2][t], fy=[30,28,27,27,27][t], d=DAYS[t], s='';
    if(t>=3){
      s+='<path d="M44 22 L41 6 L51 13 L60 2 L69 13 L79 6 L76 22 C70 19 50 19 44 22Z" fill="'+(off?'#ECE5F7':'#F59E0B')+'" stroke="'+ol+'" stroke-width="2" stroke-linejoin="round"/>'+
         '<path d="M47 18 L46 11 L52 15Z M73 18 L74 11 L68 15Z" fill="'+(off?'#E2D8F2':'#FFCF7A')+'"/>'+
         (off?'':'<circle cx="60" cy="8.5" r="2.6" fill="'+(t===4?'#FF6FA8':'#7EC9F7')+'" stroke="'+OL+'" stroke-width="1.2"/>');
    }
    s+='<path d="'+SH+'" fill="'+sh[1]+'" stroke="'+ol+'" stroke-width="2.6" stroke-linejoin="round"/><path d="'+SH_IN+'" fill="'+sh[0]+'"/>';
    if(TRIM[t]&&!off) s+='<path d="'+SH_IN+'" fill="none" stroke="'+TRIM[t]+'" stroke-width="'+(t===4?3:2)+'" stroke-linejoin="round"/>';
    if(!off){
      s+='<path d="M33 36 Q 34 30 44 29" stroke="#FFFFFF" stroke-opacity=".45" stroke-width="2.6" fill="none" stroke-linecap="round"/>'+
         '<path d="M88 64 Q 86 82 70 92" stroke="'+OL+'" stroke-opacity=".22" stroke-width="2.6" fill="none" stroke-linecap="round"/>'+
         '<ellipse cx="60" cy="58" rx="20" ry="24" fill="'+FLAMES[t][1]+'" opacity=".28"/>';
    }
    s+='<g transform="translate('+(60-32*fs)+' '+(fy-6*fs)+') scale('+fs+')">'+flameGroup(t,off)+'</g>';
    if(!off){ if(t>=1)s+=star4(36,42,3.4,'#FFCF7A'); if(t>=2)s+=star4(84,48,2.8,'#FFFFFF'); if(t===4)s+=star4(86,32,3.2,'#FFCF7A'); }
    var tail=off?'#E2D8F2':'#5E37A8';
    s+='<path d="M24 86 L14 86 L19 93 L14 100 L28 100Z" fill="'+tail+'" stroke="'+ol+'" stroke-width="2" stroke-linejoin="round"/>'+
       '<path d="M96 86 L106 86 L101 93 L106 100 L92 100Z" fill="'+tail+'" stroke="'+ol+'" stroke-width="2" stroke-linejoin="round"/>'+
       '<path d="M24 84 L96 84 L96 100 L24 100Z" fill="'+(off?'#ECE5F7':BANNER[t])+'" stroke="'+ol+'" stroke-width="2.2" stroke-linejoin="round"/>'+
       (off?'':'<path d="M27 87.5 L93 87.5" stroke="#FFFFFF" stroke-opacity=".5" stroke-width="1.8" stroke-linecap="round"/>')+
       /* the number is a Latin numeral in both languages, so the text stays LTR */
       '<text x="60" y="97" text-anchor="middle" direction="ltr" font-family="Nunito,Arial,sans-serif" font-weight="900" font-size="'+(d>=100?13.5:14.5)+'" fill="'+(off?'#B9AAD6':OL)+'" letter-spacing=".5">'+d+'</text>';
    return '<svg class="sk-crest" width="'+size+'" height="'+Math.round(size*120/116)+'" viewBox="2 -6 116 120" overflow="visible" aria-hidden="true" focusable="false">'+s+'</svg>';
  }
  /* the existing streak flame icon, unchanged except for size */
  function flame(size){
    return '<svg class="sk-flame" width="'+size+'" height="'+size+'" viewBox="0 0 64 64" aria-hidden="true" focusable="false">'+
      '<ellipse cx="32" cy="55" rx="14" ry="3" fill="#2A1266" opacity=".25"/><ellipse cx="32" cy="54" rx="13" ry="2.4" fill="#7B4FD4" stroke="#2A1266" stroke-width="1.6"/><ellipse cx="32" cy="53.4" rx="9" ry="1.2" fill="#B995F3" opacity=".8"/>'+
      flameGroup(0,false)+
      '<circle cx="48" cy="14" r="1.8" fill="#F59E0B" stroke="#2A1266" stroke-width="0.8"/><circle cx="14" cy="20" r="1.4" fill="#FFCF7A"/></svg>';
  }
  function miniFlame(){
    return '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="'+P.outer+'" fill="#FFFFFF" stroke="#2A1266" stroke-width="4" stroke-linejoin="round"/></svg>';
  }
  function tierFor(days){ var t=-1; for(var i=0;i<DAYS.length;i++){ if(days>=DAYS[i]) t=i; } return t; }
  window.StreakBadges={crest:crest,flame:flame,miniFlame:miniFlame,DAYS:DAYS,NAMES:NAMES,tierFor:tierFor};
})();
