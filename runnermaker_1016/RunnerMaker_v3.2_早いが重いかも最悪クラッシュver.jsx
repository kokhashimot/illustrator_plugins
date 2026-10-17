#target illustrator
(function(){
/* Pure geometry/routing core. ES3. Coordinates: Illustrator [left,top,right,bottom]. */
var RunnerCore=(function(){
    var E=0.00001, MM=72/25.4, workPause=null, workStatus=null;
    function breathe(){if(workPause)workPause();}
    function notifyWork(stage,at,total){if(workStatus)try{workStatus(stage,at||0,total||0);}catch(ignore){workStatus=null;}}
    function err(s){throw new Error(s);}
    function cp(p){return [p[0],p[1]];}
    function bounds(b){return [b[0],b[1],b[2],b[3]];}
    function w(b){return b[2]-b[0];} function h(b){return b[1]-b[3];}
    function ctr(b){return [(b[0]+b[2])/2,(b[1]+b[3])/2];}
    function len(a,b){return Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);}
    function close(a,b){return len(a,b)<E;}
    function inside(p,b){return p[0]>b[0]+E&&p[0]<b[2]-E&&p[1]<b[1]-E&&p[1]>b[3]+E;}
    function expand(b,r){return [b[0]-r,b[1]+r,b[2]+r,b[3]-r];}
    function union(a,b){return [Math.min(a[0],b[0]),Math.max(a[1],b[1]),Math.max(a[2],b[2]),Math.min(a[3],b[3])];}
    function overlap(a,b){return Math.min(a[2],b[2])-Math.max(a[0],b[0])>E&&Math.min(a[1],b[1])-Math.max(a[3],b[3])>E;}
    function boxGap(a,b){return Math.max(Math.max(a[0]-b[2],b[0]-a[2],0),Math.max(a[3]-b[1],b[3]-a[1],0));}
    function hit(a,b,r,pad){pad=pad||0;
        if(Math.abs(a[1]-b[1])<E) return a[1]>(r[3]-pad)+E&&a[1]<(r[1]+pad)-E&&Math.max(a[0],b[0])>(r[0]-pad)+E&&Math.min(a[0],b[0])<(r[2]+pad)-E;
        if(Math.abs(a[0]-b[0])<E) return a[0]>(r[0]-pad)+E&&a[0]<(r[2]+pad)-E&&Math.max(a[1],b[1])>(r[3]-pad)+E&&Math.min(a[1],b[1])<(r[1]+pad)-E;
        err('内部エラー: 斜めの経路');
    }
    function clear(a,b,boxes,skip,pad){var i;for(i=0;i<boxes.length;i++)if(boxes[i].owner!==skip&&hit(a,b,boxes[i].b,pad))return false;return true;}
    function clean(ps){var r=[],i;for(i=0;i<ps.length;i++){if(r.length&&close(r[r.length-1],ps[i]))continue;r.push(cp(ps[i]));while(r.length>=3){var a=r[r.length-3],b=r[r.length-2],c=r[r.length-1];if((Math.abs(a[0]-b[0])<E&&Math.abs(b[0]-c[0])<E&&(b[1]-a[1])*(c[1]-b[1])>=0)||(Math.abs(a[1]-b[1])<E&&Math.abs(b[1]-c[1])<E&&(b[0]-a[0])*(c[0]-b[0])>=0))r.splice(r.length-2,1);else break;}}return r;}
    function pathLen(ps){var z=0,i;for(i=1;i<ps.length;i++)z+=len(ps[i-1],ps[i]);return z;}
    function cfgDefaults(){return {mode:'auto',frameW:0,frameH:0,frameRatio:false,ratioW:1,ratioH:1,centerIndex:-1,margin:16*MM,width:3*MM,railWidth:5.1*MM,frameWidth:6*MM,border:.45*MM,gap:1.5*MM,taper:3*MM,tip:.4,radius:3*MM,frameRadius:8*MM,merge:4*MM,maxGate:25*MM,pairs:true,backbones:true,target:0};}
    // Removed UI fields use physical defaults and width/frame-relative values.
    function deriveWidths(c){c.border=.45*MM;c.radius=.6*c.railWidth;c.frameRadius=4*c.frameWidth/3;c.merge=.8*c.railWidth;c.margin=Math.max(16*MM,c.frameWidth/2+c.border+c.radius+MM);}
    function deriveGate(c,frame){c.maxGate=Math.max(.2*Math.min(w(frame),h(frame)),c.taper+c.width/2+c.border+.5*MM,c.railWidth/2+c.border+c.gap+c.radius+.5*MM);}
    function copyParts(raw){var a=[],i,j;for(i=0;i<raw.length;i++){var p=raw[i],q={item:p.item,name:p.name,group:p.group||'',b:bounds(p.b),edges:[],stroke:p.stroke||0,fallback:!!p.fallback,index:i,dx:0,dy:0,used:0,count:0,target:0,linked:false};for(j=0;!q.fallback&&j<p.edges.length;j++)q.edges.push([cp(p.edges[j][0]),cp(p.edges[j][1])]);a.push(q);}return a;}
    function shift(p,x,y){delete p.contourIndex;p.dx+=x;p.dy+=y;p.b=[p.b[0]+x,p.b[1]+y,p.b[2]+x,p.b[3]+y];var i;for(i=0;i<p.edges.length;i++){p.edges[i][0][0]+=x;p.edges[i][1][0]+=x;p.edges[i][0][1]+=y;p.edges[i][1][1]+=y;}}
    function allBounds(ps){var b=bounds(ps[0].b),i;for(i=1;i<ps.length;i++)b=union(b,ps[i].b);return b;}
    function density(ps,c){var b=allBounds(ps),sum=0,ov=0,crowded={},i,j,near=2*(c.railWidth/2+c.border+c.gap+c.radius),n=0;for(i=0;i<ps.length;i++){sum+=w(ps[i].b)*h(ps[i].b);for(j=0;j<i;j++){if(overlap(ps[i].b,ps[j].b))ov++;if(boxGap(ps[i].b,ps[j].b)<near){crowded[i]=true;crowded[j]=true;}}}for(i in crowded)if(crowded.hasOwnProperty(i))n++;return {areaRatio:sum/(w(b)*h(b)),overlaps:ov,crowded:n/ps.length};}
    function grouping(ps){var groups=[],map={},free=[],i,j,best,bi;
        for(i=0;i<ps.length;i++){var tag=ps[i].group;if(tag){var k='$'+tag;if(!map[k]){map[k]={id:tag,parts:[]};groups.push(map[k]);}map[k].parts.push(ps[i]);}else free.push(ps[i]);}
        free.sort(function(a,b){return b.b[1]-a.b[1]||a.b[0]-b.b[0];});
        while(free.length){var seed=free.shift(),g={id:'AUTO'+(groups.length+1),parts:[seed]},cb=bounds(seed.b);while(g.parts.length<4&&free.length){best=1e100;bi=0;for(j=0;j<free.length;j++){var u=union(cb,free[j].b),s=w(u)*h(u)-w(cb)*h(cb);if(s<best){best=s;bi=j;}}var p=free.splice(bi,1)[0];g.parts.push(p);cb=union(cb,p.b);}groups.push(g);}return groups;
    }
    function shelf(rects,W,gap,order){var rs=rects.slice(0),x=0,y=0,rowH=0,placed=[],i,maxW=0;rs.sort(order);for(i=0;i<rs.length;i++){var r=rs[i];if(r.w>W+E)return null;if(x>0&&x+r.w>W+E){y+=rowH+gap;x=0;rowH=0;}placed.push({r:r,x:x,y:y});maxW=Math.max(maxW,x+r.w);x+=r.w+gap;rowH=Math.max(rowH,r.h);}return {places:placed,w:maxW,h:y+rowH};}
    function packBest(rects,gap,fixedW,fixedH,aspect,outerPad){var sum=0,maxW=0,i,j,k,best=null,bscore=1e100;for(i=0;i<rects.length;i++){sum+=(rects[i].w+gap)*(rects[i].h+gap);maxW=Math.max(maxW,rects[i].w);}var orders=[function(a,b){return b.h-a.h||b.w-a.w;},function(a,b){return b.w-a.w||b.h-a.h;},function(a,b){return b.w*b.h-a.w*a.h;}];var ratios=[.65,.85,1,1.2,1.5,1.9,2.4,3.2];for(j=0;j<orders.length;j++)for(k=0;k<(fixedW?1:ratios.length);k++){var W=fixedW||Math.max(maxW,Math.sqrt(sum)*(aspect?Math.sqrt(aspect):1)*ratios[k]),r=shelf(rects,W,gap,orders[j]);if(!r||(fixedH&&r.h>fixedH+E))continue;var score;if(aspect){var targetW=Math.max(r.w+outerPad,(r.h+outerPad)*aspect);score=targetW*(targetW/aspect);}else score=r.w*r.h*(1+.12*Math.abs(Math.log(r.w/r.h)));if(score<bscore){best=r;bscore=score;}}return best;}
    function pack(ps,c,spare){var groups=grouping(ps),gap=2*(c.railWidth/2+c.border+c.gap+c.radius)+(spare===undefined ? .2:spare),ggap=gap*1.3,rects=[],i,j;for(i=0;i<groups.length;i++){var rs=[];for(j=0;j<groups[i].parts.length;j++)rs.push({p:groups[i].parts[j],w:w(groups[i].parts[j].b),h:h(groups[i].parts[j].b)});var r=packBest(rs,gap,0,0);groups[i].layout=r;rects.push({g:groups[i],w:r.w,h:r.h});}
        var fw=c.frameW?c.frameW-2*c.margin:0,fh=c.frameH?c.frameH-2*c.margin:0;
        if((c.frameW&&fw<=0)||(c.frameH&&fh<=0))err('外枠の寸法が余白より小さいです。');
        var whole=packBest(rects,ggap,fw,fh,c.frameRatio?c.ratioW/c.ratioH:0,2*c.margin+c.frameWidth+2*c.border);if(!whole)err('指定した外枠へ収まりません。枠を広げるか、群を分けて実行してください。自動縮小は行いません。');
        var b=allBounds(ps),ox=b[0]+(fw?(fw-whole.w)/2:0),oy=b[1]-(fh?(fh-whole.h)/2:0);
        for(i=0;i<whole.places.length;i++){var gp=whole.places[i],g=gp.r.g;for(j=0;j<g.layout.places.length;j++){var pp=g.layout.places[j],p=pp.r.p;shift(p,ox+gp.x+pp.x-p.b[0],oy-gp.y-pp.y-p.b[1]);p.packedGroup=g.id;}}
        return {groups:groups.length,anchor:b};
    }
    // Preserve axis order; adjust rectangle centers only. No artwork access or routing here.
    function relativeAxis(ps,axis,gap){var n=ps.length,origin=[],half=[],order=[],rank=[],intervals=[],cuts=[],i,j,edgeEnd=-1e100;
        for(i=0;i<n;i++){var b=ps[i].b,v=axis===0?(b[0]+b[2])/2:-(b[1]+b[3])/2,z=axis===0?w(b)/2:h(b)/2;origin.push(v);half.push(z);order.push(i);intervals.push([v-z,v+z]);}
        order.sort(function(a,b){return origin[a]-origin[b]||a-b;});for(i=0;i<n;i++)rank[order[i]]=i;
        intervals.sort(function(a,b){return a[0]-b[0]||a[1]-b[1];});for(i=0;i<n;i++){if(edgeEnd>-1e99&&intervals[i][0]>edgeEnd+2*gap){var empty=intervals[i][0]-edgeEnd;cuts.push({mid:(edgeEnd+intervals[i][0])/2,amount:Math.min(empty-2*gap,.35*empty)});}edgeEnd=Math.max(edgeEnd,intervals[i][1]);}
        var target=[],meanShift=0;for(i=0;i<n;i++){var v=origin[i];for(j=0;j<cuts.length;j++)if(origin[i]>cuts[j].mid)v-=cuts[j].amount;target.push(v);meanShift+=v-origin[i];}meanShift/=n;for(i=0;i<n;i++)target[i]-=meanShift;
        var edges=[];for(i=1;i<n;i++)edges.push({a:order[i-1],b:order[i],d:0,q:0});return {origin:origin,half:half,order:order,rank:rank,target:target,edges:edges,cuts:cuts.length};
    }
    function solveRelativeAxis(a){var x=a.target.slice(0),sweep,k,largest=0,passes=0;for(sweep=0;sweep<192;sweep++){breathe();largest=0;for(k=0;k<a.edges.length;k++){var e=a.edges[k],u=x[e.a]+e.q,v=x[e.b]-e.q,correction=Math.max(0,(e.d-(v-u))/2),nu=u-correction,nv=v+correction;largest=Math.max(largest,Math.abs(nu-x[e.a]),Math.abs(nv-x[e.b]));x[e.a]=nu;x[e.b]=nv;e.q=correction;}passes++;if(largest<.00001)break;}
        // One DAG feasibility repair, not a retry of layout/routing.
        var incoming=[],i;for(i=0;i<x.length;i++)incoming.push([]);for(k=0;k<a.edges.length;k++)incoming[a.edges[k].b].push(a.edges[k]);for(i=0;i<a.order.length;i++){var id=a.order[i];for(k=0;k<incoming[id].length;k++){var e=incoming[id][k];x[id]=Math.max(x[id],x[e.a]+e.d);}}
        for(i=0;i<x.length;i++)x[i]=Math.round(x[i]*1000)/1000;
        for(i=0;i<x.length;i++)x[i]=Math.round(x[i]*1000)/1000;
        return {positions:x,passes:passes};
    }
    function relativeLayout(ps,c,spare){var original=allBounds(ps),center=ctr(original),gap=2*(c.railWidth/2+c.border+c.gap+c.radius)+2*MM+(spare===undefined ? .2:spare),axes=[relativeAxis(ps,0,gap),relativeAxis(ps,1,gap)],i,j;
        for(i=0;i<ps.length;i++)for(j=0;j<i;j++){var ax=axes[0],ay=axes[1],dx=Math.abs(ax.origin[i]-ax.origin[j]),dy=Math.abs(ay.origin[i]-ay.origin[j]),sx=dx-ax.half[i]-ax.half[j],sy=dy-ay.half[i]-ay.half[j],axis;
            if(sx>=-E&&sy< -E)axis=0;else if(sy>=-E&&sx< -E)axis=1;else axis=dx/Math.max(E,ax.half[i]+ax.half[j])>=dy/Math.max(E,ay.half[i]+ay.half[j])?0:1;
            var a=axes[axis],lo=a.rank[i]<a.rank[j]?i:j,hi=lo===i?j:i;a.edges.push({a:lo,b:hi,d:a.half[i]+a.half[j]+gap+.004,q:0});
        }
        var alreadyClear=true;for(i=0;i<ps.length;i++)for(j=0;j<i;j++)if(boxGap(ps[i].b,ps[j].b)<gap+.004)alreadyClear=false;if(alreadyClear&&axes[0].cuts+axes[1].cuts===0)return {groups:0,anchor:original,relative:{passesX:0,passesY:0,passLimit:192,gap:gap,maxMoveX:0,maxMoveY:0,limitX:Math.max(.25*w(original),2*gap),limitY:Math.max(.25*h(original),2*gap),closedBands:0,center:center}};
        var alreadyClear=true;for(i=0;i<ps.length;i++)for(j=0;j<i;j++)if(boxGap(ps[i].b,ps[j].b)<gap+.004)alreadyClear=false;if(alreadyClear&&axes[0].cuts+axes[1].cuts===0)return {groups:0,anchor:original,relative:{passesX:0,passesY:0,passLimit:192,gap:gap,maxMoveX:0,maxMoveY:0,limitX:Math.max(.25*w(original),2*gap),limitY:Math.max(.25*h(original),2*gap),closedBands:0,center:center}};
        var rx=solveRelativeAxis(axes[0]),ry=solveRelativeAxis(axes[1]),positions=[],b=null;for(i=0;i<ps.length;i++){var x=rx.positions[i],y=-ry.positions[i],q=[x-w(ps[i].b)/2,y+h(ps[i].b)/2,x+w(ps[i].b)/2,y-h(ps[i].b)/2];positions.push(q);b=b?union(b,q):q;}
        var bc=ctr(b),tx=center[0]-bc[0],ty=center[1]-bc[1],limitX=Math.max(.25*w(original),2*gap),limitY=Math.max(.25*h(original),2*gap),maximumX=0,maximumY=0,moves=[];
        for(i=0;i<ps.length;i++){var dx=positions[i][0]+tx-ps[i].b[0],dy=positions[i][1]+ty-ps[i].b[1];if(Math.abs(dx)<E)dx=0;if(Math.abs(dy)<E)dy=0;if(!isFinite(dx)||!isFinite(dy)||Math.abs(dx)>limitX+E||Math.abs(dy)>limitY+E)err('元の位置関係を保てる移動範囲では通路を確保できません。重なりを減らすか、元の間隔を少し広げてください。自動で並べ替え・縮小はしません。');maximumX=Math.max(maximumX,Math.abs(dx));maximumY=Math.max(maximumY,Math.abs(dy));moves.push([dx,dy]);}
        for(i=0;i<ps.length;i++)shift(ps[i],moves[i][0],moves[i][1]);
        for(i=0;i<ps.length;i++)for(j=0;j<i;j++){var ci=ctr(ps[i].b),cj=ctr(ps[j].b);if((axes[0].origin[i]-axes[0].origin[j])*(ci[0]-cj[0])< -E||(axes[1].origin[i]-axes[1].origin[j])*(-ci[1]+cj[1])< -E||boxGap(ps[i].b,ps[j].b)<gap-.0001)err('位置関係または通路の検査に失敗しました。原本は変更しません。');}
        return {groups:0,anchor:original,relative:{passesX:rx.passes,passesY:ry.passes,passLimit:192,gap:gap,maxMoveX:maximumX,maxMoveY:maximumY,limitX:limitX,limitY:limitY,closedBands:axes[0].cuts+axes[1].cuts,center:center}};
    }
    // One immovable part. Numeric rectangle candidates only; routing runs after selection.
    function centerIndex(c){return c.centerIndex===undefined?-1:c.centerIndex;}
    function frameAt(center,outerW,c){var stroke=c.frameWidth+2*c.border,outerH=outerW*c.ratioH/c.ratioW,f=[center[0]-(outerW-stroke)/2,center[1]+(outerH-stroke)/2,center[0]+(outerW-stroke)/2,center[1]-(outerH-stroke)/2],i;for(i=0;i<4;i++)if(!isFinite(f[i])||Math.abs(f[i])>16383)return null;return w(f)>0&&h(f)>0?f:null;}
    function innerFrame(f,c){return [f[0]+c.margin,f[1]-c.margin,f[2]-c.margin,f[3]+c.margin];}
    function contained(a,b){return a[0]>=b[0]-E&&a[1]<=b[1]+E&&a[2]<=b[2]+E&&a[3]>=b[3]-E;}
    function pruneFree(rects){var out=[],i,j;for(i=0;i<rects.length;i++)if(w(rects[i])>E&&h(rects[i])>E)out.push(rects[i]);for(i=0;i<out.length;i++)for(j=out.length-1;j>=0;j--)if(i!==j&&contained(out[j],out[i])){out.splice(j,1);if(j<i)i--;}
        return out.length<=128?out:null;
    }
    function occupyFree(free,used){var out=[],i;for(i=0;i<free.length;i++){var f=free[i];if(!overlap(f,used)){out.push(f);continue;}if(used[0]>f[0]+E)out.push([f[0],f[1],Math.min(f[2],used[0]),f[3]]);if(used[2]<f[2]-E)out.push([Math.max(f[0],used[2]),f[1],f[2],f[3]]);if(used[1]<f[1]-E)out.push([f[0],f[1],f[2],Math.max(f[3],used[1])]);if(used[3]>f[3]+E)out.push([f[0],Math.min(f[1],used[3]),f[2],f[3]]);}return pruneFree(out);}
    function aroundCenter(rects,frame,pin,gap,groupGap,c,order){var inside=innerFrame(frame,c),reserved=expand(pin.b,gap),free=pruneFree([[inside[0],inside[1],inside[2],Math.max(inside[3],reserved[1])],[inside[0],Math.min(inside[1],reserved[3]),inside[2],inside[3]],[inside[0],inside[1],Math.min(inside[2],reserved[0]),inside[3]],[Math.max(inside[0],reserved[2]),inside[1],inside[2],inside[3]]]),rs=rects.slice(0),places=[],i,j;
        if(!free)return null;rs.sort(order);
        for(i=0;i<rs.length;i++){var r=rs[i],best=-1,shortest=1e100,waste=1e100;for(j=0;j<free.length;j++){var fw=w(free[j]),fh=h(free[j]);if(fw+E<r.w||fh+E<r.h)continue;var ss=Math.min(fw-r.w,fh-r.h),area=fw*fh-r.w*r.h;if(ss<shortest-E||(Math.abs(ss-shortest)<=E&&area<waste)){best=j;shortest=ss;waste=area;}}if(best<0)return null;var box=[free[best][0],free[best][1],free[best][0]+r.w,free[best][1]-r.h];if(!contained(box,inside)||overlap(box,reserved))return null;places.push({r:r,x:box[0],y:box[1]});free=occupyFree(free,expand(box,groupGap));if(!free)return null;}
        return places;
    }
    function packCenter(ps,c,spare){var pin=ps[centerIndex(c)],center=ctr(pin.b),rest=[],i,j;for(i=0;i<ps.length;i++)if(i!==centerIndex(c))rest.push(ps[i]);var gap=2*(c.railWidth/2+c.border+c.gap+c.radius)+(spare===undefined ? .2:spare),groupGap=gap*1.3,groups=grouping(rest),rects=[],area=(w(pin.b)+2*gap)*(h(pin.b)+2*gap),shelfW=0,shelfH=0;
        for(i=0;i<groups.length;i++){var rs=[];for(j=0;j<groups[i].parts.length;j++)rs.push({p:groups[i].parts[j],w:w(groups[i].parts[j].b),h:h(groups[i].parts[j].b)});var layout=packBest(rs,gap,0,0);if(!layout)err('中央の周囲へ配置する群を作れません。');groups[i].layout=layout;rects.push({g:groups[i],w:layout.w,h:layout.h,orderIndex:i});area+=(layout.w+groupGap)*(layout.h+groupGap);shelfW+=layout.w+(i?groupGap:0);shelfH=Math.max(shelfH,layout.h);}
        var ratio=c.ratioW/c.ratioH,pad=2*c.margin+c.frameWidth+2*c.border,minW=Math.max(w(pin.b)+pad,(h(pin.b)+pad)*ratio),safeW=rects.length?Math.max(Math.max(w(pin.b),shelfW)+pad,(h(pin.b)+2*gap+2*shelfH+pad)*ratio):minW,baseW=Math.min(safeW,Math.max(minW,Math.sqrt(area*ratio)+pad)),best=null,attempts=0,lastW=-1;
        if(!rects.length){var only=frameAt(center,minW,c);if(!only)err('中央固定の外枠が座標の検査範囲を超えます。');return {groups:1,anchor:bounds(pin.b),centerFrame:only,centerCandidates:1};}
        var factors=[1,1.15,1.35,1.6,1.95,2.4,3],orders=[function(a,b){return b.h-a.h||b.w-a.w||a.orderIndex-b.orderIndex;},function(a,b){return b.w-a.w||b.h-a.h||a.orderIndex-b.orderIndex;},function(a,b){return b.w*b.h-a.w*a.h||a.orderIndex-b.orderIndex;}],k;
        for(i=0;i<factors.length&&!best;i++){var width=Math.min(safeW,baseW*factors[i]);if(Math.abs(width-lastW)<E)continue;lastW=width;var frame=frameAt(center,width,c);if(!frame)continue;for(k=0;k<orders.length;k++){attempts++;var places=aroundCenter(rects,frame,pin,gap,groupGap,c,orders[k]);if(places){best={frame:frame,places:places};break;}}}
        // One guaranteed top-row arrangement, not an unbounded resize/retry loop.
        if(!best){attempts++;var fallback=frameAt(center,safeW,c);if(fallback){var row=[],x=center[0]-shelfW/2,top=pin.b[1]+gap+shelfH;for(i=0;i<rects.length;i++){row.push({r:rects[i],x:x,y:top});x+=rects[i].w+groupGap;}best={frame:fallback,places:row};}}
        if(!best)err('中央固定で収まる外枠を座標の検査範囲内に作れません。比率・素材の位置や大きさを見直してください。');
        var inside=innerFrame(best.frame,c),reserved=expand(pin.b,gap);for(i=0;i<best.places.length;i++){var place=best.places[i],box=[place.x,place.y,place.x+place.r.w,place.y-place.r.h];if(!contained(box,inside)||overlap(box,reserved))err('中央固定の配置余白を確保できません。');for(j=0;j<i;j++){var prev=best.places[j],other=[prev.x,prev.y,prev.x+prev.r.w,prev.y-prev.r.h];if(overlap(box,other))err('中央固定の周囲で群が重なっています。');}}
        for(i=0;i<best.places.length;i++){var gp=best.places[i],g=gp.r.g;for(j=0;j<g.layout.places.length;j++){var pp=g.layout.places[j],p=pp.r.p;shift(p,gp.x+pp.x-p.b[0],gp.y-pp.y-p.b[1]);p.packedGroup=g.id;}}
        return {groups:groups.length+1,anchor:bounds(pin.b),centerFrame:best.frame,centerCandidates:attempts};
    }
    // Exact edge buckets and query reuse. No contour simplification or rounded keys.
    function contourAxis(p,axis){var root=p.contourIndex||(p.contourIndex=[]);if(root[axis])return root[axis];var bins=16,lo=axis===1?p.b[3]:p.b[0],span=axis===1?h(p.b):w(p.b),index={buckets:[],cache:{},lo:lo,scale:span>0?bins/span:0},i,j;
        for(i=0;i<bins;i++)index.buckets.push([]);
        for(i=0;i<p.edges.length;i++){var edge=p.edges[i],av=edge[0][axis],bv=edge[1][axis],delta=bv-av;if(Math.abs(delta)<E)continue;var pad=E*(Math.abs(delta)+1),first=Math.max(0,Math.min(bins-1,Math.floor((Math.min(av,bv)-pad-lo)*index.scale))),last=Math.max(0,Math.min(bins-1,Math.floor((Math.max(av,bv)+pad-lo)*index.scale)));for(j=first;j<=last;j++)index.buckets[j].push(edge);}
        root[axis]=index;return index;
    }
    function contourAt(p,side,q){var horizontal=side<2,best=null,i;if(p.fallback||!p.edges.length)return horizontal?[side===0?p.b[0]:p.b[2],q]:[q,side===2?p.b[1]:p.b[3]];
        var axis=horizontal?1:0,index=contourAxis(p,axis),key='q'+q,range=index.cache[key];if(range===undefined){var edges=index.buckets[Math.max(0,Math.min(15,Math.floor((q-index.lo)*index.scale)))],low=null,high=null;
            for(i=0;i<edges.length;i++){var a=edges[i][0],b=edges[i][1],av=a[axis],bv=b[axis],t=(q-av)/(bv-av),v;if(t< -E||t>1+E)continue;v=horizontal?a[0]+(b[0]-a[0])*t:a[1]+(b[1]-a[1])*t;if(low===null||v<low)low=v;if(high===null||v>high)high=v;}
            range=[low,high];index.cache[key]=range;}
        best=range[side===0||side===3?0:1];if(best===null)return null;best+=(side===0||side===3?-1:1)*p.stroke;return horizontal?[best,q]:[q,best];
    }
    // Conservative horizontal silhouette slabs: no hole shortcuts, no inward curve approximation.
    function silhouette(p){if(p.fallback||!p.edges.length)return [{b:bounds(p.b),owner:p.index}];var out=[],bins=8,i,j;for(i=0;i<bins;i++){breathe();var top=p.b[1]-h(p.b)*i/bins,bot=p.b[1]-h(p.b)*(i+1)/bins,lo=1e100,hi=-1e100;for(j=0;j<p.edges.length;j++){var a=p.edges[j][0],b=p.edges[j][1],ylo=Math.max(bot,Math.min(a[1],b[1])),yhi=Math.min(top,Math.max(a[1],b[1]));if(yhi<ylo-E)continue;var x1,x2;if(Math.abs(a[1]-b[1])<E){x1=a[0];x2=b[0];}else{x1=a[0]+(b[0]-a[0])*(ylo-a[1])/(b[1]-a[1]);x2=a[0]+(b[0]-a[0])*(yhi-a[1])/(b[1]-a[1]);}lo=Math.min(lo,x1,x2);hi=Math.max(hi,x1,x2);}if(hi>=lo)out.push({b:[lo-p.stroke-.25,top,hi+p.stroke+.25,bot],owner:p.index});}return out.length?out:[{b:bounds(p.b),owner:p.index}];}
    function obstacles(ps){var r=[],i,j;for(i=0;i<ps.length;i++){notifyWork('outline',i+1,ps.length);breathe();var s=silhouette(ps[i]);for(j=0;j<s.length;j++)r.push(s[j]);}return r;}
    function padBoxes(boxes,r){var a=[],i;for(i=0;i<boxes.length;i++)a.push({b:expand(boxes[i].b,r),owner:boxes[i].owner});return a;}
    function frameBounds(ps,c,packed){var b=allBounds(ps),f=expand(b,c.margin);if(centerIndex(c)>=0){if(packed&&packed.centerFrame)return bounds(packed.centerFrame);var center=ctr(ps[centerIndex(c)].b),stroke=c.frameWidth+2*c.border,pad=2*c.margin+stroke,needW=2*Math.max(center[0]-b[0],b[2]-center[0])+pad,needH=2*Math.max(b[1]-center[1],center[1]-b[3])+pad,pinned=frameAt(center,Math.max(needW,needH*c.ratioW/c.ratioH),c);if(!pinned)err('中央固定の外枠が座標の検査範囲を超えます。');return pinned;}if(c.frameRatio){var stroke=c.frameWidth+2*c.border,aspect=c.ratioW/c.ratioH,outerW=Math.max(w(f)+stroke,(h(f)+stroke)*aspect),outerH=outerW/aspect,cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2;var sized=[cx-(outerW-stroke)/2,cy+(outerH-stroke)/2,cx+(outerW-stroke)/2,cy-(outerH-stroke)/2],i;for(i=0;i<4;i++)if(!isFinite(sized[i])||Math.abs(sized[i])>16383)err('指定比率では外枠が座標の検査範囲を超えます。比率を1：1に近づけるか、素材の位置・大きさを見直してください。');return sized;}if(c.frameW){if(packed)f[0]=packed.anchor[0]-c.margin;else f[0]=(b[0]+b[2]-c.frameW)/2;f[2]=f[0]+c.frameW;}if(c.frameH){if(packed)f[1]=packed.anchor[1]+c.margin;else f[1]=(b[1]+b[3]+c.frameH)/2;f[3]=f[1]-c.frameH;}if(b[0]<f[0]+c.margin-E||b[2]>f[2]-c.margin+E||b[1]>f[1]-c.margin+E||b[3]<f[3]+c.margin-E)err('パーツと余白が指定枠に収まりません。配置を詰めるか枠寸法を広げてください。');return f;}
    function pointBlocked(p,boxes){var i;for(i=0;i<boxes.length;i++)if(inside(p,boxes[i].b))return true;return false;}
    function inCorner(p,f,r){return ((p[0]<f[0]+r-E)||(p[0]>f[2]-r+E))&&((p[1]>f[1]-r+E)||(p[1]<f[3]+r-E));}
    function makeGrid(frame,boxes,c){var longest=Math.max(w(frame),h(frame)),step=Math.max(2*MM,longest/56),nx=Math.max(3,Math.ceil(w(frame)/step)+1),ny=Math.max(3,Math.ceil(h(frame)/step)+1),dx=w(frame)/(nx-1),dy=h(frame)/(ny-1),g={nx:nx,ny:ny,dx:dx,dy:dy,nodes:[],adj:[],used:[],frame:frame},x,y,id,i;
        for(y=0;y<ny;y++)for(x=0;x<nx;x++){if(x===0)breathe();var p=[frame[0]+x*dx,frame[3]+y*dy];id=y*nx+x;g.nodes.push(p);g.adj.push([]);g.used.push(false);if(pointBlocked(p,boxes)||inCorner(p,frame,c.frameRadius))g.adj[id]=null;else if(x===0||x===nx-1||y===0||y===ny-1)g.used[id]=true;}
        for(y=0;y<ny;y++)for(x=0;x<nx;x++){if(x===0)breathe();id=y*nx+x;if(!g.adj[id])continue;var neighbors=[];if(x+1<nx)neighbors.push(id+1);if(y+1<ny)neighbors.push(id+nx);for(i=0;i<neighbors.length;i++){var ni=neighbors[i];if(g.adj[ni]&&clear(g.nodes[id],g.nodes[ni],boxes,-1,0)){var axis=i===0&&ni===id+1?0:(ni===id+1?0:1);var edgeLength=len(g.nodes[id],g.nodes[ni]);g.adj[id].push({id:ni,axis:axis,cost:edgeLength});g.adj[ni].push({id:id,axis:axis,cost:edgeLength});}}}return g;
    }
    function heapPush(a,v){var i=a.length;a.push(v);while(i>0){var p=Math.floor((i-1)/2);if(a[p].v<=v.v)break;a[i]=a[p];i=p;}a[i]=v;}
    function heapPop(a){var r=a[0],v=a.pop();if(a.length){var i=0;while(i*2+1<a.length){var j=i*2+1;if(j+1<a.length&&a[j+1].v<a[j].v)j++;if(a[j].v>=v.v)break;a[i]=a[j];i=j;}a[i]=v;}return r;}
    function pathsFromNetwork(g,c,sources,cache){var dist=cache?cache.dist:[],prev=cache?cache.prev:[],heap=[],i,s,pops=0;if(!cache)for(i=0;i<g.nodes.length*3;i++){dist[i]=1e100;prev[i]=-1;}for(i=0;i<g.nodes.length;i++)if((sources?sources[i]:g.used[i])&&g.adj[i]){s=i*3+2;if(dist[s]>E){dist[s]=0;prev[s]=-1;heapPush(heap,{id:s,v:0});}}
        // Network only grows: propagate improvements from newly rooted nodes, reuse other distances.
        while(heap.length){if((pops++%64)===0)breathe();var cur=heapPop(heap);if(cur.v>dist[cur.id]+E)continue;var node=Math.floor(cur.id/3),dir=cur.id%3,a=g.adj[node],j;for(j=0;j<a.length;j++){var e=a[j],ns=e.id*3+e.axis,nv=cur.v+e.cost+(dir!==2&&dir!==e.axis?2*MM:0);if(nv<dist[ns]-E){dist[ns]=nv;prev[ns]=cur.id;heapPush(heap,{id:ns,v:nv});}}}return {dist:dist,prev:prev};
    }
    function Lpaths(a,b,boxes){var p1=clean([a,[a[0],b[1]],b]),p2=clean([a,[b[0],a[1]],b]),out=[],i,j;var cs=[p1,p2];for(i=0;i<2;i++){var ok=true;for(j=1;j<cs[i].length;j++)if(!clear(cs[i][j-1],cs[i][j],boxes,-1,0)){ok=false;break;}if(ok)out.push(cs[i]);}return out;}
    function ports(p,g,base,route,c){var ratios=[.5,.28,.72],dirs=[[-1,0],[1,0],[0,1],[0,-1]],ports=[],d,k,z;
        for(d=0;d<4;d++)for(k=0;k<ratios.length;k++){breathe();var q=d<2?p.b[3]+h(p.b)*ratios[k]:p.b[0]+w(p.b)*ratios[k],start=contourAt(p,d,q);if(!start)continue;
            var min=Math.max(c.taper+c.width/2+c.border+.25,c.railWidth/2+c.border+c.gap+c.radius+.3),stub=null;
            for(z=0;z<4;z++){var length=min+z*Math.max(g.dx,g.dy),candidate=[start[0]+dirs[d][0]*length,start[1]+dirs[d][1]*length];if(length>c.maxGate+E)break;if(candidate[0]<g.frame[0]-E||candidate[0]>g.frame[2]+E||candidate[1]>g.frame[1]+E||candidate[1]<g.frame[3]-E)continue;if(!pointBlocked(candidate,route)&&clear(start,candidate,base,p.index,c.width/2+c.border+c.gap)&&!inCorner(candidate,g.frame,c.frameRadius)){stub=candidate;break;}}
            if(!stub)continue;var port={part:p,dir:d,start:start,stub:stub,joins:[]},near=[],ix=Math.round((stub[0]-g.frame[0])/g.dx),iy=Math.round((stub[1]-g.frame[3])/g.dy),xx,yy;
            for(yy=Math.max(0,iy-2);yy<=Math.min(g.ny-1,iy+2);yy++)for(xx=Math.max(0,ix-2);xx<=Math.min(g.nx-1,ix+2);xx++){var id=yy*g.nx+xx;if(g.adj[id])near.push({id:id,d:len(stub,g.nodes[id])});}near.sort(function(a,b){return a.d-b.d;});
            for(z=0;z<near.length&&port.joins.length<6;z++){var choices=Lpaths(stub,g.nodes[near[z].id],route);if(choices.length)port.joins.push({id:near[z].id,ps:choices[0],cost:pathLen(choices[0])+(choices[0].length>2?2*MM:0)});}if(port.joins.length)ports.push(port);
        }return ports;
    }
    function projectedJoin(stub,segments,route,c,cache){var valid=cache&&cache.projectedSegments===segments&&cache.projectedCount<=segments.length,best=valid?cache.projectedBest:null,i;for(i=valid?cache.projectedCount:0;i<segments.length;i++){var s=segments[i],q=Math.abs(s[0][1]-s[1][1])<E?[Math.max(Math.min(stub[0],Math.max(s[0][0],s[1][0])),Math.min(s[0][0],s[1][0])),s[0][1]]:[s[0][0],Math.max(Math.min(stub[1],Math.max(s[0][1],s[1][1])),Math.min(s[0][1],s[1][1]))];if(len(stub,q)>c.maxGate+c.merge)continue;var choices=Lpaths(stub,q,route),j;for(j=0;j<choices.length;j++){var cost=pathLen(choices[j])+(choices[j].length>2?2*MM:0);if(!best||cost<best.cost)best={ps:choices[j],cost:cost};}}if(cache){cache.projectedSegments=segments;cache.projectedCount=segments.length;cache.projectedBest=best;}return best;}
    function bestPort(p,ports,search,g,segments,route,c,gates){var best=null,i,j,k;for(i=0;i<ports.length;i++){var port=ports[i];if(p.used&(1<<port.dir))continue;var collision=false,gi;for(gi=0;gi<gates.length;gi++)if(gateNear({a:port.start,b:port.stub},gates[gi],c.width+2*c.border+c.gap)){collision=true;break;}if(collision)continue;var oppositeBonus=p.used&(1<<(port.dir^1))?3*MM:0;var gateCost=len(port.start,port.stub),join=projectedJoin(port.stub,segments,route,c,port);if(join){var score=gateCost+join.cost-oppositeBonus;if(!best||score<best.score)best={port:port,score:score,join:join.ps,state:-1};}
        for(j=0;j<port.joins.length;j++)for(k=0;k<3;k++){var a=port.joins[j],state=a.id*3+k,cost=search.dist[state]+a.cost+gateCost-oppositeBonus;if(cost<1e90&&(!best||cost<best.score))best={port:port,score:cost,join:a.ps,state:state};}}
        return best;
    }
    function addSegments(segments,ps){var i;ps=clean(ps);for(i=1;i<ps.length;i++)if(!close(ps[i-1],ps[i]))segments.push([cp(ps[i-1]),cp(ps[i])]);}
    // Truncate a new parallel route onto a nearby existing rooted rail, not another parallel bar.
    function attachNear(ps,segments,route,c){var original=pathLen(ps),prefix=0,best=null,i,j;for(i=1;i<ps.length;i++){var a=ps[i-1],b=ps[i],axis=Math.abs(a[1]-b[1])<E?0:1,other=axis===0?1:0,lo=Math.min(a[axis],b[axis]),hi=Math.max(a[axis],b[axis]);for(j=0;j<segments.length;j++){var s=segments[j],sa=Math.abs(s[0][1]-s[1][1])<E?0:1;if(sa!==axis)continue;var delta=Math.abs(a[other]-s[0][other]);if(delta>c.merge+E)continue;var olo=Math.max(lo,Math.min(s[0][axis],s[1][axis])),ohi=Math.min(hi,Math.max(s[0][axis],s[1][axis]));if(ohi<olo-E)continue;var coordinate=b[axis]>=a[axis]?olo:ohi,q=cp(a),proj=cp(a);q[axis]=coordinate;proj[axis]=coordinate;proj[other]=s[0][other];var cost=prefix+len(a,q)+delta;if(cost>original+E||!clear(q,proj,route,-1,0))continue;if(!best||cost<best.cost){var result=ps.slice(0,i);result.push(q);result.push(proj);best={cost:cost,ps:clean(result)};}}prefix+=len(a,b);}return best?best.ps:ps;}
    function accept(best,data,g,search,c){var p=best.port.part,ps=best.join.slice(0),s=best.state;while(s>=0){var id=Math.floor(s/3),q=g.nodes[id];if(!close(ps[ps.length-1],q))ps.push(cp(q));s=search.prev[s];}ps=attachNear(clean(ps),data.segments,data.routeBoxes,c);addSegments(data.segments,ps);
        // Mark only nodes on the actually retained route; discarded tails are never phantom sources.
        var i,j;for(i=0;i<g.nodes.length;i++)if(g.adj[i]&&!g.used[i])for(j=1;j<ps.length;j++){var a=ps[j-1],b=ps[j],q=g.nodes[i];if(Math.abs(len(a,q)+len(q,b)-len(a,b))<E&&((Math.abs(a[0]-b[0])<E&&Math.abs(q[0]-a[0])<E)||(Math.abs(a[1]-b[1])<E&&Math.abs(q[1]-a[1])<E))){g.used[i]=true;break;}}
        data.gates.push({a:cp(best.port.start),b:cp(best.port.stub),owners:[p.index],dirs:[best.port.dir],pair:false});p.used|=1<<best.port.dir;p.count++;p.linked=true;}
    function pairOptions(a,b,base,c){var options=[],horizontal=[Math.max(a.b[3],b.b[3]),Math.min(a.b[1],b.b[1])],vertical=[Math.max(a.b[0],b.b[0]),Math.min(a.b[2],b.b[2])],i,j;
        for(i=0;i<2;i++){var range=i===0?horizontal:vertical;if(range[1]-range[0]<=E)continue;for(j=0;j<3;j++){var q=range[0]+(range[1]-range[0])*[.5,.28,.72][j],ac=ctr(a.b),bc=ctr(b.b),da=i===0?(bc[0]>ac[0]?1:0):(bc[1]>ac[1]?2:3),db=da^1;if(a.used&(1<<da)||b.used&(1<<db))continue;var x=contourAt(a,da,q),y=contourAt(b,db,q);if(!x||!y)continue;var l=len(x,y),forward=i===0?(y[0]-x[0])*(da===1?1:-1):(y[1]-x[1])*(da===2?1:-1);if(forward<=0||l<2*c.taper+c.width+2*c.border+.5||l>c.maxGate)continue;var ok=true,k;for(k=0;k<base.length;k++)if(base[k].owner!==a.index&&base[k].owner!==b.index&&hit(x,y,base[k].b,c.width/2+c.border+c.gap)){ok=false;break;}if(ok)options.push({a:x,b:y,owners:[a.index,b.index],dirs:[da,db],pair:true,cost:l});}}
        options.sort(function(x,y){return x.cost-y.cost;});return options;
    }
    function pairs(data,base,c){var ps=data.parts,candidates=[],i,j;for(i=0;i<ps.length;i++){var near=[];for(j=i+1;j<ps.length;j++)near.push({p:ps[j],d:boxGap(ps[i].b,ps[j].b)});near.sort(function(a,b){return a.d-b.d;});for(j=0;j<Math.min(6,near.length);j++){var op=pairOptions(ps[i],near[j].p,base,c);if(op.length)candidates.push(op[0]);}}
        candidates.sort(function(a,b){return a.cost-b.cost;});for(i=0;i<candidates.length;i++){var q=candidates[i],a=ps[q.owners[0]],b=ps[q.owners[1]];if(!a.linked||!b.linked||(a.count>=a.target&&b.count>=b.target)||(a.used&(1<<q.dirs[0]))||(b.used&(1<<q.dirs[1])))continue;var collision=false;for(j=0;j<data.gates.length;j++)if(gateNear(q,data.gates[j],c.width+2*c.border+c.gap)){collision=true;break;}if(collision)continue;data.gates.push(q);a.used|=1<<q.dirs[0];b.used|=1<<q.dirs[1];a.count++;b.count++;}
    }
    function gateNear(a,b,r){var half=r/2,al=Math.min(a.a[0],a.b[0])-half,at=Math.max(a.a[1],a.b[1])+half,ar=Math.max(a.a[0],a.b[0])+half,ab=Math.min(a.a[1],a.b[1])-half,bl=Math.min(b.a[0],b.b[0])-half,bt=Math.max(b.a[1],b.b[1])+half,br=Math.max(b.a[0],b.b[0])+half,bb=Math.min(b.a[1],b.b[1])-half;return Math.min(ar,br)-Math.max(al,bl)>E&&Math.min(at,bt)-Math.max(ab,bb)>E;}
    // Select a few useful opposite-frame trunks; do not draw every packing/group boundary.
    function seedBackbones(data,g,ports,route,c){if(!c.backbones||data.parts.length<3)return;var b=allBounds(data.parts),proposals=[],axis,k,i,j;
        for(axis=0;axis<2;axis++)for(k=0;k<3;k++){breathe();var ratio=[.33,.5,.67][k],pos=axis===0?b[3]+h(b)*ratio:b[0]+w(b)*ratio,index=axis===0?Math.round((pos-g.frame[3])/g.dy):Math.round((pos-g.frame[0])/g.dx),a=axis===0?index*g.nx:index,z=axis===0?index*g.nx+g.nx-1:(g.ny-1)*g.nx+index;if(!g.adj[a]||!g.adj[z])continue;var source=[];source[a]=true;var search=pathsFromNetwork(g,c,source),state=-1,dist=1e100;for(i=0;i<3;i++)if(search.dist[z*3+i]<dist){dist=search.dist[z*3+i];state=z*3+i;}if(dist>1e90)continue;var ps=[],ids=[];while(state>=0){var id=Math.floor(state/3);ps.push(cp(g.nodes[id]));ids.push(id);state=search.prev[state];}ps=clean(ps);var seg=[];addSegments(seg,ps);var covered=[],benefit=0;
            for(i=0;i<ports.length;i++){var best=1e100;for(j=0;j<ports[i].length;j++){var port=ports[i][j],join=projectedJoin(port.stub,seg,route,c);if(join)best=Math.min(best,len(port.start,port.stub)+Math.max(0,join.cost));}if(best<=c.maxGate+E){covered.push(i);benefit+=1+(c.maxGate-best)/c.maxGate;}}
            if(covered.length>=2)proposals.push({ps:ps,ids:ids,covered:covered,benefit:benefit,cost:pathLen(ps),used:false});
        }
        var seen={},limit=Math.min(3,Math.ceil(data.parts.length/14));data.backbones=0;
        for(k=0;k<limit;k++){var best=null,bs=-1e100;for(i=0;i<proposals.length;i++){var q=proposals[i];if(q.used)continue;var score=0;for(j=0;j<q.covered.length;j++)score+=seen[q.covered[j]] ? .15 : 1;score+=q.benefit*.12;score-=q.cost/(Math.max(w(data.frame),h(data.frame)))*.35;if(score>bs){bs=score;best=q;}}if(!best||bs<1.1)break;best.used=true;var ps=attachNear(best.ps,data.segments,route,c);if(pathLen(ps)<Math.max(w(data.frame),h(data.frame))*.15)continue;addSegments(data.segments,ps);for(i=0;i<best.ids.length;i++){var id=best.ids[i],p=g.nodes[id],on=false;for(j=1;j<ps.length;j++)if(Math.abs(len(ps[j-1],p)+len(p,ps[j])-len(ps[j-1],ps[j]))<E){on=true;break;}if(on)g.used[id]=true;}for(i=0;i<best.covered.length;i++)seen[best.covered[i]]=true;data.backbones++;}
    }
    function pointKey(p){return 'p'+p[0].toFixed(5)+':'+p[1].toFixed(5);}
    // Geometric union: co-linear overlap/dedup, split at T/crossings, then degree-2 chains.
    function network(segments,anchors){
        anchors=anchors||[];var raw=[],groups={},i,j,k;for(i=0;i<segments.length;i++){var s=segments[i],axis=Math.abs(s[0][1]-s[1][1])<E?0:1,pos=s[0][axis===0?1:0],lo=Math.min(s[0][axis],s[1][axis]),hi=Math.max(s[0][axis],s[1][axis]),key=axis+':'+pos.toFixed(5);if(hi-lo<E)continue;if(!groups[key])groups[key]={axis:axis,pos:pos,spans:[]};groups[key].spans.push([lo,hi]);}
        for(k in groups)if(groups.hasOwnProperty(k)){var g=groups[k];g.spans.sort(function(a,b){return a[0]-b[0];});var current=g.spans[0].slice(0);for(i=1;i<=g.spans.length;i++){if(i<g.spans.length&&g.spans[i][0]<=current[1]+E)current[1]=Math.max(current[1],g.spans[i][1]);else{raw.push({axis:g.axis,pos:g.pos,lo:current[0],hi:current[1],cuts:[current[0],current[1]]});if(i<g.spans.length)current=g.spans[i].slice(0);}}}
        for(i=0;i<raw.length;i++)for(j=0;j<i;j++)if(raw[i].axis!==raw[j].axis){var a=raw[i],b=raw[j];if(b.pos>=a.lo-E&&b.pos<=a.hi+E&&a.pos>=b.lo-E&&a.pos<=b.hi+E){a.cuts.push(b.pos);b.cuts.push(a.pos);}}
        for(i=0;i<raw.length;i++)for(j=0;j<anchors.length;j++){var rr=raw[i],pp=anchors[j];if(Math.abs(pp[rr.axis===0?1:0]-rr.pos)<E&&pp[rr.axis]>=rr.lo-E&&pp[rr.axis]<=rr.hi+E)rr.cuts.push(pp[rr.axis]);}
        var forced={};for(i=0;i<anchors.length;i++)forced[pointKey(anchors[i])]=true;
        var nodes=[],map={},edges=[];function node(p){var key=pointKey(p);if(map[key]===undefined){map[key]=nodes.length;nodes.push({p:p,adj:[],forced:!!forced[key]});}return map[key];}
        for(i=0;i<raw.length;i++){var r=raw[i];r.cuts.sort(function(a,b){return a-b;});for(j=1;j<r.cuts.length;j++){var lo=r.cuts[j-1],hi=r.cuts[j];if(hi-lo<E)continue;var aa=r.axis===0?[lo,r.pos]:[r.pos,lo],bb=r.axis===0?[hi,r.pos]:[r.pos,hi],na=node(aa),nb=node(bb),ei=edges.length;edges.push({a:na,b:nb,used:false});nodes[na].adj.push(ei);nodes[nb].adj.push(ei);}}
        var chains=[];function walk(n,e){var ps=[nodes[n].p],cur=n,edge=e;while(true){if(edges[edge].used)break;edges[edge].used=true;cur=edges[edge].a===cur?edges[edge].b:edges[edge].a;ps.push(nodes[cur].p);if(nodes[cur].adj.length!==2||nodes[cur].forced)break;var a=nodes[cur].adj;edge=edges[a[0]].used?a[1]:a[0];if(edges[edge].used)break;}chains.push(clean(ps));}
        for(i=0;i<nodes.length;i++)if(nodes[i].adj.length!==2||nodes[i].forced)for(j=0;j<nodes[i].adj.length;j++)if(!edges[nodes[i].adj[j]].used)walk(i,nodes[i].adj[j]);for(i=0;i<edges.length;i++)if(!edges[i].used)walk(edges[i].a,i);return {segments:raw,chains:chains,nodes:nodes};
    }
    function validateConfig(c){if(!/^(relative|auto|keep|pack)$/.test(c.mode))err('配置の設定が不正です。');if(c.mode==='relative'&&centerIndex(c)>=0)err('位置関係の調整と中央固定は併用できません。');var ci=centerIndex(c);if(typeof ci!=='number'||!isFinite(ci)||ci!==Math.floor(ci)||ci< -1)err('中央固定のパーツ指定が不正です。');if(ci>=0&&!c.frameRatio)err('中央固定には外枠の比率指定が必要です。');if(c.frameRatio){if(typeof c.ratioW!=='number'||typeof c.ratioH!=='number'||!isFinite(c.ratioW)||!isFinite(c.ratioH)||c.ratioW<=0||c.ratioH<=0||!isFinite(c.ratioW/c.ratioH)||c.ratioW/c.ratioH<=0)err('外枠比率は横・縦とも0より大きい有限値を入力してください。');if(c.frameW||c.frameH)err('外枠比率と旧固定寸法は同時に指定できません。');}var keys=['margin','width','railWidth','frameWidth','border','gap','taper','radius','frameRadius','merge','maxGate','frameW','frameH'],i;for(i=0;i<keys.length;i++)if(!isFinite(c[keys[i]])||c[keys[i]]<0)err('設定値が不正: '+keys[i]);if(c.width+2*c.border<=0||c.railWidth<c.width||c.frameWidth<c.width)err('太さを確認してください。親・外枠は子以上で、幅とフチを両方0にはできません。');if(c.tip<=0||c.tip>1)err('先端は0より大きく100%以下にしてください。');if(c.taper+c.width/2+c.border>c.maxGate)err('最大ゲート長がテーパーの必要長より短いです。');if((c.frameW===0)!==(c.frameH===0))err('固定枠は幅と高さの両方を指定してください。');if(c.margin<c.frameWidth/2+c.border+c.radius+1)err('外枠の余白が小さすぎます。');}
    function planOnce(raw,c,spare){if(c.autoDerived){deriveWidths(c);c.maxGate=Math.max(c.taper+c.width/2+c.border,MM);}validateConfig(c);if(!raw.length||raw.length>40)err('1〜40パーツを選んでください。');if(centerIndex(c)>=raw.length)err('中央固定の対象パーツがありません。');var ps=copyParts(raw),d=density(ps,c),doPack=c.mode==='pack'||(c.mode==='auto'&&(centerIndex(c)>=0?ps.length>1:(d.overlaps>0||(ps.length>=12&&(d.crowded>=.65||d.areaRatio>=.55))))),packed=null;
        notifyWork(c.mode==='relative'?'relative':(doPack?'pack':'keep'));
        if(c.mode==='relative')packed=relativeLayout(ps,c,spare);else if(doPack)packed=centerIndex(c)>=0?packCenter(ps,c,spare):pack(ps,c,spare);else if(d.overlaps)err('パーツが重なっています。「詰め直す」を使うか配置を修正してください。');
        var frame=frameBounds(ps,c,packed);if(c.autoDerived){deriveGate(c,frame);validateConfig(c);}c.frameRadius=Math.min(c.frameRadius,w(frame)/4,h(frame)/4,c.margin*.7);
        var base=obstacles(ps),padding=c.railWidth/2+c.border+c.gap+c.radius,route=padBoxes(base,padding);notifyWork('grid');var g=makeGrid(frame,route,c),allPorts=[],i,j,sizes=[];
        var data={parts:ps,frame:frame,base:base,routeBoxes:route,gates:[],segments:[],packed:doPack,groups:packed?packed.groups:0,density:d,missing:[],unlinked:[],gridNodes:g.nodes.length,inputSegments:0};
        if(packed&&packed.relative)data.relativeLayout=packed.relative;
        if(centerIndex(c)>=0){var pinnedPart=ps[centerIndex(c)],pinCenter=ctr(pinnedPart.b);data.centerPin={index:pinnedPart.index,name:pinnedPart.name,center:pinCenter,candidates:packed?packed.centerCandidates:0,budget:22};if(pinnedPart.dx!==0||pinnedPart.dy!==0)err('中央固定のパーツが移動しました。');}
        for(i=0;i<ps.length;i++)sizes.push(Math.sqrt(w(ps[i].b)*h(ps[i].b)));sizes.sort(function(a,b){return a-b;});var median=sizes[Math.floor(sizes.length/2)];for(i=0;i<ps.length;i++){notifyWork('ports',i+1,ps.length);var aspect=Math.max(w(ps[i].b),h(ps[i].b))/Math.min(w(ps[i].b),h(ps[i].b));ps[i].target=c.target||((aspect>=1.8||Math.sqrt(w(ps[i].b)*h(ps[i].b))>1.5*median)?3:2);allPorts.push(ports(ps[i],g,base,route,c));}
        var searchCache=null;function connect(first){var iter,limit=ps.length*(first?1:4);for(iter=0;iter<limit;iter++){breathe();var search=pathsFromNetwork(g,c,null,searchCache),best=null;searchCache=search;for(i=0;i<ps.length;i++){if(first?ps[i].linked:(!ps[i].linked||ps[i].count>=ps[i].target))continue;var cand=bestPort(ps[i],allPorts[i],search,g,data.segments,route,c,data.gates);if(cand&&(!best||cand.score<best.score))best=cand;}if(!best)break;accept(best,data,g,search,c);}}
        if(c.backbones)notifyWork('backbones');seedBackbones(data,g,allPorts,route,c);notifyWork('connect');connect(true);if(c.pairs){notifyWork('pairs');pairs(data,base,c);}notifyWork('directions');connect(false);g=null;allPorts=null;searchCache=null;notifyWork('network');
        for(i=0;i<ps.length;i++){delete ps[i].contourIndex;if(!ps[i].linked)data.unlinked.push(ps[i].index);if(ps[i].count<ps[i].target)data.missing.push(ps[i].index);}data.inputSegments=data.segments.length;var anchors=[];for(i=0;i<data.gates.length;i++)if(!data.gates[i].pair)anchors.push(data.gates[i].b);data.network=network(data.segments,anchors);data.segments=[];for(i=0;i<data.network.segments.length;i++){var s=data.network.segments[i];data.segments.push(s.axis===0?[[s.lo,s.pos],[s.hi,s.pos]]:[[s.pos,s.lo],[s.pos,s.hi]]);}return data;
    }
    // Exactly one plan. Missing/unlinked connections are reported, never trigger repacking.
    function plan(raw,c,progress,pause,status){
        var previousPause=workPause,previousStatus=workStatus;workPause=typeof pause==='function'?pause:null;workStatus=typeof status==='function'?status:null;try{
        var cc={},key,i,deficit=0;for(key in c)if(c.hasOwnProperty(key))cc[key]=c[key];
        if(progress)progress({stage:'start',attempt:1,spare:.2,text:''});
        var data=planOnce(raw,cc,.2);
        for(i=0;i<data.parts.length;i++)deficit+=Math.max(0,data.parts[i].target-data.parts[i].count);
        if(c.autoDerived){var derived=['border','margin','radius','frameRadius','merge','maxGate'];for(i=0;i<derived.length;i++)c[derived[i]]=cc[derived[i]];c.derivedReady=true;}else c.frameRadius=cc.frameRadius;
        data.layoutAttempts=[{number:1,spare:.2,missing:data.missing.length,unlinked:data.unlinked.length,deficit:deficit,area:w(data.frame)*h(data.frame)}];data.layoutChoice=1;data.layoutRetryCount=0;data.packingSpare=.2;
        if(progress)progress({stage:'done',attempt:1,spare:.2,text:'',deficit:deficit,unlinked:data.unlinked.length});
        return data;
        }finally{workPause=previousPause;workStatus=previousStatus;}
    }
    function taperedPolygon(a,b,width,tip,taper,both,border){var L=len(a,b),ux=(b[0]-a[0])/L,uy=(b[1]-a[1])/L,nx=-uy,ny=ux,samples=[[0,width*tip/2+border],[Math.min(taper,L),width/2+border]];if(both){samples.push([L-Math.min(taper,L),width/2+border]);samples.push([L,width*tip/2+border]);}else samples.push([L,width/2+border]);if(taper<=E){samples=[[0,width/2+border],[L,width/2+border]];}var out=[],i;for(i=0;i<samples.length;i++)out.push([a[0]+ux*samples[i][0]+nx*samples[i][1],a[1]+uy*samples[i][0]+ny*samples[i][1]]);for(i=samples.length-1;i>=0;i--)out.push([a[0]+ux*samples[i][0]-nx*samples[i][1],a[1]+uy*samples[i][0]-ny*samples[i][1]]);return out;}
    // Cubic rounded chain, validated by conservative inflated collision boxes.
    function rounded(ps,R,collision){ps=clean(ps);var out=[{p:cp(ps[0]),l:cp(ps[0]),r:cp(ps[0])}],i;for(i=1;i<ps.length-1;i++){var prev=ps[i-1],v=ps[i],next=ps[i+1],aL=len(prev,v),bL=len(v,next),r=Math.min(R,aL*.45,bL*.45),inX=(v[0]-prev[0])/aL,inY=(v[1]-prev[1])/aL,outX=(next[0]-v[0])/bL,outY=(next[1]-v[1])/bL;if(Math.abs(inX*outY-inY*outX)<E){out.push({p:cp(v),l:cp(v),r:cp(v)});continue;}
            var tin,tout,c1,c2,k,ok=false;while(r>.05){tin=[v[0]-inX*r,v[1]-inY*r];tout=[v[0]+outX*r,v[1]+outY*r];c1=[tin[0]+inX*r*.5522847498,tin[1]+inY*r*.5522847498];c2=[tout[0]-outX*r*.5522847498,tout[1]-outY*r*.5522847498];ok=true;for(k=0;k<=32;k++){var t=k/32,u=1-t,p=[u*u*u*tin[0]+3*u*u*t*c1[0]+3*u*t*t*c2[0]+t*t*t*tout[0],u*u*u*tin[1]+3*u*u*t*c1[1]+3*u*t*t*c2[1]+t*t*t*tout[1]];if(pointBlocked(p,collision)){ok=false;break;}}if(ok)break;r/=2;}
            if(ok){out.push({p:tin,l:cp(tin),r:c1});out.push({p:tout,l:c2,r:cp(tout)});}else out.push({p:cp(v),l:cp(v),r:cp(v)});
        }var last=ps[ps.length-1];if(!close(out[out.length-1].p,last))out.push({p:cp(last),l:cp(last),r:cp(last)});return out;
    }
    return {plan:plan,defaults:cfgDefaults,contourAt:contourAt,silhouette:silhouette,clear:clear,hit:hit,expand:expand,padBoxes:padBoxes,network:network,makeGrid:makeGrid,pathsFromNetwork:pathsFromNetwork,attachNear:attachNear,rounded:rounded,taperedPolygon:taperedPolygon,clean:clean,len:len,pointBlocked:pointBlocked,pack:pack};
})();

/* Illustrator adapter: never expand/outline/move source artwork. */
var phase='開始', current='', doc=null, originalLayer=null, originalSelection=null, output=null;
var complete=false, trace=[], logWritten=0, logFile=null, logIssue='', config=null, planned=null, summary='', resultText='', started=0;
// Status-only modeless palette. It never asks for confirmation or cancels work.
var progressUI=null,progressDisabled=false;
var coreWorkLabels={relative:'配置を調整中',pack:'パーツ群を配置中',keep:'配置を確認中',outline:'概形を計算中',grid:'経路探索を準備中',ports:'接続候補を計算中',backbones:'共有幹を計算中',connect:'接続経路を計算中',pairs:'パーツ間の接続を計算中',directions:'接続方向を計算中',network:'経路を整理中'};
var workLabels={'パーツ読取':'パーツ・輪郭を読み取り中','配置・概形・共有経路の計算':'計算を開始中','描画予定の事前検査':'描画前の検査中','出力レイヤ作成':'出力レイヤーを作成中','描画':'描画を準備中','外枠描画':'外枠を描画中','幹描画':'幹を描画中','ゲート描画':'ゲートを描画中','パーツの配置目安':'配置目安を描画中','パーツ複製':'パーツを複製・配置中','接続状態の表示':'接続状態を記録中','レイヤ順序の整理':'レイヤーを整理中','接続状態レイヤの保護':'出力を整理中','外枠全体の表示':'表示位置を調整中','結果記録':'結果を記録中'};
function progressClose(){var u=progressUI;progressUI=null;if(u)try{u.window.close();}catch(ignore){try{u.window.hide();}catch(hideError){}}}
function progressTick(now,force){var u=progressUI;if(!u)return;if(!now)now=new Date().getTime();if(!force&&now-u.lastPaint<400)return;
    try{u.title.text=u.label;u.detail.text=(u.total>0?'対象 '+u.at+' / '+u.total+' 件  ・  ':'')+'経過 '+Math.max(0,Math.floor((now-u.started)/1000))+' 秒';u.window.update();u.lastPaint=now;}
    catch(ignore){progressDisabled=true;progressClose();}
}
function progressSet(label,at,total,force){var u=progressUI;if(!u)return;var changed=u.label!==label;u.label=label;u.at=at||0;u.total=total||0;if(changed||force)progressTick(0,true);}
function progressOpen(label){if(progressDisabled||progressUI)return;var w=null;
    try{w=new Window('palette','RunnerMaker v3.2-fast2 不安定版 — 処理中',undefined,{closeButton:false});w.orientation='column';w.alignChildren=['left','top'];w.margins=12;w.spacing=6;
        var title=w.add('statictext',undefined,label);title.preferredSize=[320,24];var detail=w.add('statictext',undefined,'経過 0 秒');detail.preferredSize=[320,20];
        var notice=w.add('statictext',undefined,'処理中は操作せず、完了までお待ちください。\n応答なしとなっても問題なく作成されるので、\nそのまま処理が終わるまでお待ちください。',{multiline:true});notice.preferredSize=[320,60];
        w.add('statictext',undefined,'終了時に自動で閉じます。');var now=new Date().getTime();progressUI={window:w,title:title,detail:detail,label:label,at:0,total:0,started:now,lastPaint:0};
        w.onClose=function(){if(progressUI&&progressUI.window===w)progressUI=null;return true;};try{w.center();}catch(ignore){}w.show();progressTick(now,true);
    }catch(ignore){progressDisabled=true;progressClose();if(w)try{w.close();}catch(closeError){}}
}
function coreWork(stage,at,total){progressSet(coreWorkLabels[stage]||'計算中',at,total);}
var workAt=0,workSleep=true;
function restWork(){progressTick(new Date().getTime(),false);}
function releaseGeometry(data){var i;for(i=0;i<data.parts.length;i++){data.parts[i].edges=[];delete data.parts[i].contourIndex;}data.base=null;data.routeBoxes=null;data.network=null;}
function fail(s){throw new Error(s);}
function trim(s){return String(s).replace(/^\s+|\s+$/g,'');}
function same(a,b){if(a===b)return true;try{if(a.uuid&&b.uuid)return a.uuid===b.uuid;}catch(ignore){}return false;}
function point(p){return [p[0],p[1]];}
function distance(a,b){var dx=a[0]-b[0],dy=a[1]-b[1];return Math.sqrt(dx*dx+dy*dy);}
function mid(a,b){return [(a[0]+b[0])/2,(a[1]+b[1])/2];}
function ptLine(p,a,b){var dx=b[0]-a[0],dy=b[1]-a[1],ll=dx*dx+dy*dy;if(ll<.0000001)return distance(p,a);var t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/ll));return distance(p,[a[0]+t*dx,a[1]+t*dy]);}
function flatten(a,c,d,b,edges,depth){if(edges.length>=12000)fail('輪郭が複雑すぎます。パスを簡略化するか、パーツを分けてください。');if(Math.max(ptLine(c,a,b),ptLine(d,a,b))<=.2||depth>=12){edges.push([a,b]);return;}var ac=mid(a,c),cd=mid(c,d),db=mid(d,b),u=mid(ac,cd),v=mid(cd,db),m=mid(u,v);flatten(a,ac,u,m,edges,depth+1);flatten(m,v,db,b,edges,depth+1);}
function mergeBounds(a,b){if(!a)return [b[0],b[1],b[2],b[3]];return [Math.min(a[0],b[0]),Math.max(a[1],b[1]),Math.max(a[2],b[2]),Math.min(a[3],b[3])];}
function visible(it){try{return !it.hidden&&!it.locked;}catch(ignore){return true;}}
// Collect eligibility and bounds first. Never flatten ignored bbox-only artwork.
function readShape(it,p,depth){if(depth>40)fail('グループの階層が深すぎます。');if(!visible(it))return 0;var t=it.typename,i,n=0,ps,items,count,child;
    if(t==='GroupItem'&&!it.clipped){items=it.pageItems;count=items.length;for(i=0;i<count;i++){if(i%64===0)restWork();child=items[i];if(same(child.parent,it))n+=readShape(child,p,depth+1);}return n;}
    if(t==='CompoundPathItem'){items=it.pathItems;count=items.length;for(i=0;i<count;i++)n+=readShape(items[i],p,depth+1);return n;}
    if(t==='PathItem'){
        if(it.guides||it.clipping)return 0;var filled=it.filled,stroked=it.stroked,sw=stroked?it.strokeWidth:0;if(!filled&&!(stroked&&sw>0))return 0;
        ps=it.pathPoints;count=ps.length;if(count<2)return 0;p.b=mergeBounds(p.b,it.visibleBounds);var closed=it.closed;
        if((closed||filled)&&count>=3){if(stroked)p.stroke=Math.max(p.stroke,sw/2);if(!closed&&stroked&&sw>0)p.fallback=true;if(!p.fallback)p.shapePaths.push({points:ps,count:count,closed:closed});}
        else p.fallback=true;return 1;
    }
    if(t==='TextFrame'&&!trim(it.contents))return 0;
    // Text, images, clipping and plugin art remain untouched; collision proxy is explicit bbox.
    try{var b=it.visibleBounds;if(!b||!isFinite(b[0])||b[2]-b[0]<.01||b[1]-b[3]<.01)return 0;p.b=mergeBounds(p.b,b);p.fallback=true;return 1;}catch(e){fail('このオブジェクトの概形を読み取れません: '+t);}return 0;
}
function outlineVertex(pp){return {a:point(pp.anchor),l:point(pp.leftDirection),r:point(pp.rightDirection)};}
function readOutlines(p){var paths=p.shapePaths,i,j,entry,ps,first,prev,next;
    if(!p.fallback)for(i=0;i<paths.length;i++){entry=paths[i];ps=entry.points;first=outlineVertex(ps[0]);prev=first;
        for(j=0;j<entry.count;j++){if(j%64===0)restWork();next=j+1<entry.count?outlineVertex(ps[j+1]):first;if(j+1===entry.count&&!entry.closed)p.edges.push([prev.a,next.a]);else flatten(prev.a,prev.r,next.l,next.a,p.edges,0);prev=next;}}
    p.shapePaths=null;
}
function highestItem(it){var p=it.parent;while(p&&(p.typename==='GroupItem'||p.typename==='CompoundPathItem')){it=p;p=p.parent;}return it;}
function readInput(){step('パーツ読取');var items=[],selection=doc.selection,i,j;
    if(selection&&selection.length){for(i=0;i<selection.length;i++){if(!selection[i].typename||selection[i].typename==='TextRange'||selection[i].typename==='InsertionPoint')fail('文字の編集中ではなく、パーツのオブジェクト全体を選んでください。');var it=highestItem(selection[i]),found=false;for(j=0;j<items.length;j++)if(same(items[j],it))found=true;if(!found)items.push(it);}}
    else{if(!originalLayer.visible||originalLayer.locked)fail('対象レイヤを表示し、ロックを解除してください。');if(/^Runner_v[123]/.test(originalLayer.name))fail('生成レイヤ全体は入力にしません。04_partsを選ぶか元のパーツだけを選択してください。');var sourceItems=originalLayer.pageItems,sourceCount=sourceItems.length,sourceItem;for(i=0;i<sourceCount;i++){sourceItem=sourceItems[i];if(same(sourceItem.parent,originalLayer))items.push(sourceItem);}}
    var parts=[],skipped=0,edgeCount=0;for(i=0;i<items.length;i++){progressSet('パーツ・輪郭を読み取り中',i+1,items.length,true);restWork();var item=items[i];current=item.name||('Part '+(i+1));var p={item:item,name:current,b:null,edges:[],fallback:false,stroke:0,group:'',shapePaths:[]};var note=String(item.note||''),m=/\bRM3_GROUP=([A-Za-z0-9_-]+)/.exec(note),nameGroup=/^([^:]+)::/.exec(current);p.group=m?m[1]:(nameGroup?trim(nameGroup[1]):'');var n=readShape(item,p,0);if(!n||!p.b){skipped++;continue;}if(p.b[2]-p.b[0]<.01||p.b[1]-p.b[3]<.01){skipped++;continue;}readOutlines(p);parts.push(p);edgeCount+=p.edges.length;}
    current='';if(!parts.length)fail('有効なパーツがありません。表示・ロック解除した塗り／太さのある線／文字などを選択してください。空のグループは読み飛ばします。');if(parts.length>40)fail('対象は40パーツ以内にしてください。パーツ群を分けて実行できます。');if(edgeCount>200000)fail('輪郭の合計が複雑すぎます。パーツを分けるかパスを簡略化してください。');return {parts:parts,skipped:skipped};
}
function fixedSize(control,width,height){control.preferredSize=[width,height];control.minimumSize=[width,height];control.maximumSize=[width,height];control.alignment=['left','center'];return control;}
function field(parent,label,value){var g=parent.add('group');g.orientation='row';g.spacing=6;g.margins=0;g.alignChildren=['left','center'];fixedSize(g.add('statictext',undefined,label),112,24);var f=fixedSize(g.add('edittext',undefined,String(value)),78,24);f.helpTip=label;return f;}
function settingsColumn(parent,title){var panel=parent.add('panel',undefined,title);panel.orientation='column';panel.alignChildren=['left','top'];panel.spacing=4;panel.margins=[6,12,6,6];return panel;}
function num(f,label,min,max){var s=trim(f.text);if(!/^\d+(\.\d+)?$/.test(s))fail(label+': 半角の数値を入力してください。');var n=Number(s);if(n<min||n>max)fail(label+': '+min+'〜'+max+'で入力してください。');return n;}
/* Flat, versioned text presets. Never eval imported files; store settings only. */
var presetNumbers=[['width',0,1000],['railWidth',0,1000],['frameWidth',0,1000],['gap',0,1000],['ratioW',0,10000],['ratioH',0,10000],['taper',0,1000],['tip',.1,100]];
var presetKeys=['mode','unit','target','width','railWidth','frameWidth','gap','ratioW','ratioH','taper','tip','pairs','backbones','fitView'];
function presetKnown(k){var i;for(i=0;i<presetKeys.length;i++)if(presetKeys[i]===k)return true;return false;}
function presetNumber(p,r){var s=p[r[0]],n=Number(s);if(typeof s!=='string'||!/^\d+(\.\d+)?$/.test(s)||!isFinite(n)||n<r[1]||n>r[2])fail('設定値が範囲外です: '+r[0]);}
function presetValidate(p){var i,k;for(i=0;i<presetKeys.length;i++){k=presetKeys[i];if(typeof p[k]!=='string')fail('設定ファイルに必要な項目がありません: '+k);}
    for(k in p)if(p.hasOwnProperty(k)&&!presetKnown(k))fail('設定ファイルに不明な項目があります。');
    if(!/^(relative|auto|keep|pack)$/.test(p.mode))fail('配置の設定が不正です。');
    if(!/^(mm|pt|px)$/.test(p.unit))fail('単位の設定が不正です。');
    if(!/^(0|2|3|4)$/.test(p.target))fail('接続方向の設定が不正です。');
    for(i=0;i<presetNumbers.length;i++)presetNumber(p,presetNumbers[i]);
    if(Number(p.ratioW)<=0||Number(p.ratioH)<=0)fail('外枠比率は横・縦とも0より大きい値を入力してください。');
    if(!/^[01]$/.test(p.pairs)||!/^[01]$/.test(p.backbones)||!/^[01]$/.test(p.fitView))fail('チェック項目の設定が不正です。');return p;
}
function presetEncode(p){presetValidate(p);var lines=['RUNNERMAKER_SETTINGS 6'],i;for(i=0;i<presetKeys.length;i++)lines.push(presetKeys[i]+'='+p[presetKeys[i]]);return lines.join('\r\n')+'\r\n';}
function presetDecode(text){text=String(text).replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');if(text.length>8192)fail('設定ファイルが大きすぎます。');var lines=text.split('\n'),p={},i;
    if(lines[0]!=='RUNNERMAKER_SETTINGS 6')fail('設定ファイルの形式が正しくありません。');
    for(i=1;i<lines.length;i++){var s=trim(lines[i]);if(!s)continue;var m=/^([A-Za-z][A-Za-z0-9]*)=([^=]*)$/.exec(s);if(!m||!presetKnown(m[1]))fail('設定ファイルに不明な項目があります。');if(typeof p[m[1]]!=='undefined')fail('設定項目が重複しています: '+m[1]);p[m[1]]=trim(m[2]);}
    return presetValidate(p);
}
function savePresetFile(text){var f=null,opened=false;
    try{f=File.saveDialog('設定を保存（例: RunnerMaker_Settings.txt）');if(!f)return null;
        if(!/\.txt$/i.test(f.fsName)){if(/\.[^\\\/]+$/.test(f.fsName))throw new Error('設定の保存名は .txt にしてください。AIやJSXには保存しません。');f=new File(f.fsName+'.txt');if(f.exists)throw new Error('同じ名前の設定があります。別の名前を選んでください。');}
        f.encoding='UTF-8';if(!f.open('w'))throw new Error(f.error||'保存先を開けません');opened=true;
        if(f.write('\uFEFF'+text)===false)throw new Error(f.error||'書き込み失敗');if(f.close()===false)throw new Error(f.error||'クローズ失敗');opened=false;return f;
    }catch(e){if(opened)try{f.close();}catch(ignore){}throw e;}
}
function loadPresetFile(){var f=null,opened=false;
    try{f=File.openDialog('保存したRunnerMakerの設定（.txt）を選んでください');if(!f)return null;
        if(!/\.txt$/i.test(f.fsName))throw new Error('RunnerMakerの設定 .txt を選んでください。');
        if(f.length>16384)throw new Error('設定ファイルが大きすぎます。');f.encoding='UTF-8';if(!f.open('r'))throw new Error(f.error||'設定を開けません');opened=true;
        var text=f.read();if(f.error)throw new Error(f.error);if(f.close()===false)throw new Error(f.error||'クローズ失敗');opened=false;
        return presetDecode(text);
    }catch(e){if(opened)try{f.close();}catch(ignore){}throw e;}
}
function settings(input){step('設定');var w=new Window('dialog','RunnerMaker v3.2-fast2 不安定版 — 概形・共有経路');w.orientation='column';w.alignChildren=['fill','top'];w.spacing=4;w.margins=10;
    w.add('statictext',undefined,input.parts.length+'パーツ。原本を残して、新しいレイヤーへ出力。');
    var top=w.add('group');top.orientation='row';top.spacing=8;top.alignChildren=['left','center'];
    var gm=top.add('group');gm.spacing=6;gm.add('statictext',undefined,'配置');var mode=fixedSize(gm.add('dropdownlist',undefined,['位置関係を保って調整','現在の配置をそのまま維持','パーツ群ごとに詰め直す','自動並び替え(位置関係保存なし)']),282,24);mode.selection=mode.items[0];mode.helpTip='標準は元の上下左右を入れ替えず、広すぎる空白と狭い通路を調整。原本は移動・拡縮しません。';
    var ug=top.add('group');ug.spacing=6;ug.add('statictext',undefined,'単位');var unit=fixedSize(ug.add('dropdownlist',undefined,['mm','pt','px']),66,24);unit.selection=unit.items[0];
    var presets=w.add('group');presets.orientation='row';presets.spacing=8;presets.alignChildren=['left','center'];var savePreset=fixedSize(presets.add('button',undefined,'設定を保存'),110,26),loadPreset=fixedSize(presets.add('button',undefined,'設定を読み込み'),110,26);
    var presetStatus=fixedSize(w.add('statictext',undefined,'設定ファイルの保存・読み込みは任意です。'),420,20);
    var cols=w.add('group');cols.orientation='row';cols.alignChildren=['left','top'];cols.spacing=8;cols.margins=0;var a=settingsColumn(cols,'1–4 太さ・余白'),b=settingsColumn(cols,'5–9 枠・接続');
    var width=field(a,'1 子ゲート幅',3),rail=field(a,'2 幹の幅',5.1),frame=field(a,'3 外枠の太さ',6),gap=field(a,'4 他パーツ余白',1.5);
    var fw=field(b,'5 外枠比率・横',1),fh=field(b,'6 外枠比率・縦',1),taper=field(b,'7 テーパー長',3),tip=field(b,'8 先端の幅 %',40);fw.helpTip='5 外枠比率・横：横：縦。1：1は正方形、3：2は横長。単位なし。外側の黒フチを含む。';fh.helpTip='6 外枠比率・縦：横：縦。2：3は縦長。実寸はパーツと余白から自動計算。';
    var tg=b.add('group');tg.orientation='row';tg.spacing=6;tg.margins=0;tg.alignChildren=['left','center'];fixedSize(tg.add('statictext',undefined,'9 目標方向'),62,24);var target=fixedSize(tg.add('dropdownlist',undefined,['自動（2〜3）','2','3','4（動作不安定）']),128,24);target.selection=target.items[0];target.helpTip='9 目標接続方向：上下左右の何方向から支えるか。本数とは別です。';
    var options=w.add('panel',undefined,'チェック項目');options.orientation='column';options.alignChildren=['left','top'];options.spacing=2;options.margins=[8,12,8,6];
    var pair=options.add('checkbox',undefined,'近くのパーツ同士も接続する');pair.value=true;var spine=options.add('checkbox',undefined,'必要な共有幹を先に作る');spine.value=true;
    var fit=options.add('checkbox',undefined,'生成後に外枠全体を表示する');fit.value=false;var log=options.add('checkbox',undefined,'詳細ログを保存する（エラー報告時）');log.value=false;
    fit.helpTip='チェックあり＝表示位置と倍率を調整。なし＝現在の表示を維持。';log.helpTip='チェックあり＝ログ保存先を指定。なし＝通常生成のみ。';
    var notes=w.add('group');notes.orientation='column';notes.alignChildren=['left','top'];notes.spacing=2;
    fixedSize(notes.add('statictext',undefined,'外枠比率は 横：縦。1：1＝正方形、3：2＝横長。'),420,18);
    fixedSize(notes.add('statictext',undefined,'フチ・枠余白・曲がりR・共有距離・最大ゲートは自動。'),420,18);
    fixedSize(notes.add('statictext',undefined,'単位変更時は長さの数値も変更。比率と％は単位なし。'),420,18);
    var buttons=w.add('group');buttons.orientation='row';buttons.spacing=8;buttons.alignment=['right','top'];fixedSize(buttons.add('button',undefined,'キャンセル',{name:'cancel'}),100,28);var pre=fixedSize(buttons.add('button',undefined,'プレビュー'),100,28),gen=fixedSize(buttons.add('button',undefined,'生成',{name:'ok'}),100,28),result=null;
    var comparison=w.add('statictext',undefined,'生成：黒い棒＋白フチ＋パーツ（完成出力）。\nプレビュー：黒い細線とパーツの矩形で配置を確認（原画は複製しない）。',{multiline:true});fixedSize(comparison,420,40);
    function readValues(action){var f=unit.selection.text==='mm'?72/25.4:1;var values=RunnerCore.defaults();values.autoDerived=true;values.mode=['relative','keep','pack','auto'][index(mode)];values.action=action;values.unit=unit.selection.text;values.width=num(width,'子幅',0,1000)*f;values.railWidth=num(rail,'幹幅',0,1000)*f;values.frameWidth=num(frame,'外枠幅',0,1000)*f;values.gap=num(gap,'余白',0,1000)*f;values.frameRatio=true;values.frameW=0;values.frameH=0;values.ratioW=num(fw,'外枠比率・横',0,10000);values.ratioH=num(fh,'外枠比率・縦',0,10000);if(values.ratioW<=0||values.ratioH<=0)fail('外枠比率は横・縦とも0より大きい値を入力してください。');values.taper=num(taper,'テーパー',0,1000)*f;values.tip=num(tip,'先端',.1,100)/100;values.target=index(target)===0?0:index(target)+1;values.pairs=pair.value;values.backbones=spine.value;values.fitView=fit.value;values.logDetails=log.value;return values;}
    function read(action){try{result=readValues(action);w.close(1);}catch(e){result=null;alert(e.message);}}
    var numericControls={width:width,railWidth:rail,frameWidth:frame,gap:gap,ratioW:fw,ratioH:fh,taper:taper,tip:tip};
    function capturePreset(){readValues('gen');var p={mode:['relative','keep','pack','auto'][index(mode)],unit:unit.selection.text,target:String(index(target)===0?0:index(target)+1),pairs:pair.value?'1':'0',backbones:spine.value?'1':'0',fitView:fit.value?'1':'0'},i;
        for(i=0;i<presetNumbers.length;i++){var k=presetNumbers[i][0];p[k]=trim(numericControls[k].text);}return presetValidate(p);}
    function applyPreset(p){presetValidate(p);var i;mode.selection=mode.items[p.mode==='relative'?0:(p.mode==='keep'?1:(p.mode==='pack'?2:3))];unit.selection=unit.items[p.unit==='mm'?0:(p.unit==='pt'?1:2)];target.selection=target.items[p.target==='0'?0:Number(p.target)-1];
        for(i=0;i<presetNumbers.length;i++){var k=presetNumbers[i][0];numericControls[k].text=p[k];}pair.value=p.pairs==='1';spine.value=p.backbones==='1';fit.value=p.fitView==='1';}
    savePreset.onClick=function(){try{var text=presetEncode(capturePreset()),file=savePresetFile(text);if(file)presetStatus.text='設定を保存しました。';}catch(e){alert('設定を保存できませんでした。入力はそのままです。\n'+errText(e));}};
    loadPreset.onClick=function(){try{var p=loadPresetFile();if(p){applyPreset(p);presetStatus.text='設定を読み込みました。';}}catch(e){alert('設定を読み込めませんでした。入力は変更していません。\n'+errText(e));}};
    function index(dd){var i;for(i=0;i<dd.items.length;i++)if(dd.selection===dd.items[i])return i;return 0;}
    pre.onClick=function(){read('preview');};gen.onClick=function(){read('gen');};w.defaultElement=gen;w.show();return result;
}
function gray(v){var cache=gray.cache||(gray.cache={});if(!cache['g'+v]){var c=new GrayColor();c.gray=v;cache['g'+v]=c;}return cache['g'+v];}
function red(){var c=new RGBColor();c.red=210;c.green=55;c.blue=45;return c;}
function layer(parent,name){var l=parent.layers.add();l.name=name;return l;}
function uniqueName(parent,base){var k=1,name=base,i,found;do{found=false;for(i=0;i<parent.layers.length;i++)if(parent.layers[i].name===name)found=true;if(found)name=base+'_'+(++k);}while(found);return name;}
function path(layer,points,width,color,closed,name,fill){if(!points.length)return null;if(!fill&&width<=0)return null;current=logging()?layer.name+'/'+name:name;if(logging()) drawRecord('パス開始: '+current+' / 頂点='+points.length);var p=layer.pathItems.add();if(logging()) drawRecord('座標設定前: '+current);p.setEntirePath(points);p.closed=!!closed;p.filled=!!fill;p.stroked=!fill;p.name=name;if(fill)p.fillColor=color;else{p.strokeWidth=width;p.strokeColor=color;p.strokeCap=StrokeCap.ROUNDENDCAP;p.strokeJoin=StrokeJoin.ROUNDENDJOIN;p.strokeDashes=[];}if(logging()) drawRecord('基本パス完了: '+current);return p;}
function curved(layer,vertices,width,color,closed,name){var ps=[],i;for(i=0;i<vertices.length;i++)ps.push(vertices[i].p);var p=path(layer,ps,width,color,closed,name,false);if(!p)return null;if(logging()) drawRecord('曲線ハンドル設定前: '+current);var points=p.pathPoints,pp;for(i=0;i<vertices.length;i++){pp=points[i];pp.leftDirection=vertices[i].l;pp.rightDirection=vertices[i].r;}if(logging()) drawRecord('曲線完了: '+current);return p;}
function frameVertices(f,r){var l=f[0],t=f[1],right=f[2],bottom=f[3],k=.5522847498*r;return [
    {p:[l+r,t],l:[l+r-k,t],r:[l+r,t]}, {p:[right-r,t],l:[right-r,t],r:[right-r+k,t]},
    {p:[right,t-r],l:[right,t-r+k],r:[right,t-r]}, {p:[right,bottom+r],l:[right,bottom+r],r:[right,bottom+r-k]},
    {p:[right-r,bottom],l:[right-r+k,bottom],r:[right-r,bottom]}, {p:[l+r,bottom],l:[l+r,bottom],r:[l+r-k,bottom]},
    {p:[l,bottom+r],l:[l,bottom+r-k],r:[l,bottom+r]}, {p:[l,t-r],l:[l,t-r],r:[l,t-r+k]}];}
function checkedPoints(ps,label,allowDuplicate){var i,j;if(!ps||ps.length<2)fail(label+': 描画点が不足しています。');for(i=0;i<ps.length;i++){if(!ps[i]||ps[i].length!==2)fail(label+': 座標配列が不正です。');for(j=0;j<2;j++)if(typeof ps[i][j]!=='number'||!isFinite(ps[i][j])||Math.abs(ps[i][j])>16383)fail(label+': 座標が検査範囲を超えています。');if(!allowDuplicate&&i&&RunnerCore.len(ps[i-1],ps[i])<.0000001)fail(label+': 同じ頂点が連続しています。');}}
function normalizeVertices(vs,closed){var out=[],i;for(i=0;i<vs.length;i++){var v=vs[i],q={p:point(v.p),l:point(v.l),r:point(v.r)};if(out.length&&RunnerCore.len(out[out.length-1].p,q.p)<.0000001){out[out.length-1].r=q.r;}else out.push(q);}if(closed&&out.length>1&&RunnerCore.len(out[0].p,out[out.length-1].p)<.0000001){out[0].l=out[out.length-1].l;out.pop();}return out;}
function checkedVertices(vs,label){var ps=[],i;for(i=0;i<vs.length;i++){ps.push(vs[i].p);checkedPoints([vs[i].l,vs[i].r],label+' handles',true);}checkedPoints(ps,label);return vs;}
function checkedPolygon(ps,label){checkedPoints(ps,label);var area=0,i;for(i=0;i<ps.length;i++){var q=ps[(i+1)%ps.length];area+=ps[i][0]*q[1]-q[0]*ps[i][1];}if(Math.abs(area)<.00001)fail(label+': 塗りの面積がありません。');return ps;}
function prepareDraw(data,c){var i,preview=c.action==='preview',frame=checkedVertices(normalizeVertices(frameVertices(data.frame,c.frameRadius),true),'外枠'),curves=[],gates=[],collision=RunnerCore.padBoxes(data.base,c.railWidth/2+c.border+c.gap);
    for(i=0;i<data.network.chains.length;i++){restWork();curves.push(checkedVertices(normalizeVertices(RunnerCore.rounded(data.network.chains[i],c.radius,collision),false),'幹 '+(i+1)));}
    for(i=0;i<data.gates.length;i++){restWork();var g=data.gates[i];checkedPoints([g.a,g.b],'接続 '+(i+1));if(preview)gates.push({black:[g.a,g.b],white:null});else gates.push({black:checkedPolygon(RunnerCore.taperedPolygon(g.a,g.b,c.width,c.tip,c.taper,g.pair,c.border),'接続黒 '+(i+1)),white:c.width>0?checkedPolygon(RunnerCore.taperedPolygon(g.a,g.b,c.width,c.tip,c.taper,g.pair,0),'接続白 '+(i+1)):null});}
    for(i=0;i<data.parts.length;i++){var p=data.parts[i];checkedPoints([[p.b[0],p.b[1]],[p.b[2],p.b[3]]],'パーツ '+(i+1));if(!isFinite(p.dx)||!isFinite(p.dy))fail('パーツ移動量が不正です。');}
    return {frame:frame,curves:curves,gates:gates};
}
function drawRecord(s){if(logging())record(s);}

function unlockCopy(it){restWork();try{if(it.locked)it.locked=false;}catch(ignore){}var i,items,count,child;if(it.typename==='GroupItem'){items=it.pageItems;count=items.length;for(i=0;i<count;i++){child=items[i];if(same(child.parent,it))unlockCopy(child);}}}
function copyParts(layer,data){var i;for(i=0;i<data.parts.length;i++){progressSet('パーツを複製・配置中',i+1,data.parts.length,true);restWork();current=data.parts[i].name;if(logging()) drawRecord('複製開始 '+(i+1)+'/'+data.parts.length+': '+current);var p=data.parts[i],dup=p.item.duplicate(layer,ElementPlacement.PLACEATEND);if(logging()) drawRecord('複製取得完了: '+current);unlockCopy(dup);dup.name=p.group&&p.name.indexOf('::')>=0?p.name:('00'+(i+1)).slice(-3)+'__'+p.name;if(p.dx||p.dy){if(logging()) drawRecord('複製の移動開始: '+current+' / dx='+p.dx+' / dy='+p.dy);dup.translate(p.dx,p.dy);if(logging()) drawRecord('複製の移動完了: '+current);}if(logging()) drawRecord('複製完了: '+current);}current='';}
function previewParts(layer,data){var i,p,b;for(i=0;i<data.parts.length;i++){p=data.parts[i];b=p.b;path(layer,[[b[0],b[1]],[b[2],b[1]],[b[2],b[3]],[b[0],b[3]]],.5,gray(0),true,('00'+(i+1)).slice(-3)+'__'+p.name+'__BOUNDS',false);}current='';}
function render(out,data,c,prepared){step('描画');var preview=c.action==='preview',draw=prepared||prepareDraw(data,c),black=layer(out,preview?'01_skeleton':'01_outline'),white=null,parts,notice=layer(out,'05_notices'),i;
    if(!preview)white=layer(out,'02_runner');parts=layer(out,'04_parts');
    step('外枠描画');curved(black,draw.frame,preview ? .8:c.frameWidth+2*c.border,gray(0),true,'OUTER');if(white)curved(white,draw.frame,c.frameWidth,gray(100),true,'OUTER');
    step('幹描画');for(i=0;i<draw.curves.length;i++){progressSet('幹を描画中',i+1,draw.curves.length);restWork();curved(black,draw.curves[i],preview ? .65:c.railWidth+2*c.border,gray(0),false,'Rail_'+(i+1));if(white)curved(white,draw.curves[i],c.railWidth,gray(100),false,'Rail_'+(i+1));}
    step('ゲート描画');for(i=0;i<data.gates.length;i++){progressSet('ゲートを描画中',i+1,data.gates.length);restWork();var g=data.gates[i],name=(g.pair?'Pair_':'Gate_')+(i+1);path(black,draw.gates[i].black,preview ? .65:0,gray(0),!preview,name,!preview);if(white&&draw.gates[i].white)path(white,draw.gates[i].white,0,gray(100),true,name,true);}
    current='';if(preview){step('パーツの配置目安');previewParts(parts,data);}else{step('パーツ複製');copyParts(parts,data);}
    current='';step('接続状態の表示');for(i=0;i<data.missing.length;i++){var p=data.parts[data.missing[i]],b=p.b;path(notice,[[b[0],b[1]],[b[2],b[1]],[b[2],b[3]],[b[0],b[3]]],.8,red(),true,'Need_'+(p.index+1)+'_'+p.count+'of'+p.target,false);}
    current='';step('レイヤ順序の整理');notice.zOrder(ZOrderMethod.BRINGTOFRONT);parts.zOrder(ZOrderMethod.BRINGTOFRONT);
    if(preview)notice.zOrder(ZOrderMethod.BRINGTOFRONT);else{step('接続状態レイヤの保護');notice.visible=false;notice.locked=true;}
}
function report(data,input){var s='RunnerMaker v3.2-fast2\n'+data.parts.length+'パーツ / '+(data.relativeLayout?'位置関係を保って調整':(data.packed?'群単位で詰め直し（'+data.groups+'群）':'現在の配置を維持'))+'\n幹: '+data.segments.length+'区間 / 接続: '+data.gates.length+'本 / 先行共有幹 '+(data.backbones||0)+'本',pairs=0,proxy=0,i;for(i=0;i<data.gates.length;i++)if(data.gates[i].pair)pairs++;for(i=0;i<data.parts.length;i++)if(data.parts[i].fallback)proxy++;s+='（パーツ間 '+pairs+'本）\n外枠未接続: '+data.unlinked.length+' / 目標方向未達: '+data.missing.length+'\n';if(proxy)s+='概形を外接矩形で扱ったパーツ: '+proxy+'\n';if(data.relativeLayout)s+='位置調整: X '+data.relativeLayout.passesX+' / Y '+data.relativeLayout.passesY+'回（各上限192） / 最大移動 '+(data.relativeLayout.maxMoveX/(72/25.4)).toFixed(2)+' × '+(data.relativeLayout.maxMoveY/(72/25.4)).toFixed(2)+'mm\n';if(data.layoutAttempts)s+='配置計算: '+data.layoutAttempts.length+'回 / 採用候補: '+data.layoutChoice+' / 通路の追加余裕: '+(data.packingSpare/(72/25.4)).toFixed(2)+'mm\n';if(input.skipped)s+='空／非表示／ロック等の除外: '+input.skipped+'\n';s+='\n番号 = 名前（接続方向数／目標）\n';for(i=0;i<data.parts.length;i++){var p=data.parts[i];s+=(i+1)+' = '+p.name+' ('+p.count+'/'+p.target+')'+(p.fallback?' [矩形近似]':'')+(!p.linked?' [未接続]':'')+'\n';}return s;}
/* Generation-first workflow. Logging is optional and never gates output. ES3. */
function errText(e){try{return String(e.message||e);}catch(ignore){return '詳細取得不可';}}
function writeLog(){
    if(!logFile||logWritten>=trace.length)return;
    var opened=false,first=logWritten===0;
    try{logFile.encoding='UTF-8';if(!logFile.open(first?'w':'a'))throw new Error(logFile.error||'ログを開けません');opened=true;
        var text=(first?'\uFEFF':'')+trace.slice(logWritten).join('\n')+'\n';
        if(logFile.write(text)===false)throw new Error(logFile.error||'書き込み失敗');
        if(logFile.close()===false)throw new Error(logFile.error||'クローズ失敗');opened=false;logWritten=trace.length;
    }catch(e){if(opened)try{logFile.close();}catch(ignore){}logIssue=errText(e);logFile=null;if(config)config.logDetails=false;}
}
function logging(){return !!(config&&config.logDetails);}
function record(s){if(!logging())return;trace.push('['+((new Date().getTime()-started)/1000).toFixed(2)+'s] '+s);writeLog();}
function step(s){phase=s;progressSet(workLabels[s]||s);if(logging())record('処理: '+s+(current?' / 対象: '+current:''));}
function startLog(){started=new Date().getTime();logWritten=0;trace=[];}
function chooseLog(){
    phase='詳細ログの保存先';var candidate=null;
    try{
        candidate=File.saveDialog('詳細ログの保存先（キャンセルしても生成します）');
        if(!candidate){config.logDetails=false;return;}
        if(!/\.txt$/i.test(candidate.fsName)){candidate=new File(candidate.fsName+'.txt');if(candidate.exists)throw new Error('同じ名前のログがあります。ログ保存を省略します。');}
        logFile=candidate;trace=['RunnerMaker v3.2-fast2 実行記録','日時: '+new Date().toString()];
        try{trace.push('Illustrator: '+app.version+' / OS: '+$.os);}catch(ignore){}
        if(logging())record('詳細ログの保存先: '+candidate.fsName);
    }catch(e){logIssue=errText(e);logFile=null;config.logDetails=false;}
}

function configText(c){
    var f=c.unit==='mm'?72/25.4:1;function n(x){return (x/f).toFixed(3);}
    return '実行: '+c.action+' / 配置: '+c.mode+' / 単位: '+c.unit+
        (c.frameRatio?'\n外枠比率（横:縦）: '+c.ratioW+' : '+c.ratioH+'（外側・黒フチ込み、実寸は自動）':'\n固定枠: '+n(c.frameW)+' × '+n(c.frameH)+' '+c.unit+'（0/0=自動）')+
        '\n目標接続方向: '+(c.target||'自動（2〜3）')+
        '\n幅 子/幹/枠/フチ: '+n(c.width)+' / '+n(c.railWidth)+' / '+n(c.frameWidth)+' / '+n(c.border)+
        '\n他パーツ余白/枠余白/テーパー/先端率: '+n(c.gap)+' / '+n(c.margin)+' / '+n(c.taper)+' / '+(c.tip*100).toFixed(1)+'%'+
        '\n自動設定 幹R/枠R/共有距離/最大ゲート: '+(c.autoDerived&&!c.derivedReady?'計算後に確定':n(c.radius)+' / '+n(c.frameRadius)+' / '+n(c.merge)+' / '+n(c.maxGate))+
        '\nパーツ間: '+c.pairs+' / 先行共有幹: '+c.backbones+' / 外枠全体を表示: '+(c.fitView?'オン（表示を調整）':'オフ（表示を維持）');
}
function restore(){
    try{if(originalSelection!==null)doc.selection=originalSelection;}catch(e){if(logging()) record('選択の復元に警告: '+errText(e));}
    try{doc.activeLayer=originalLayer;}catch(e2){if(logging()) record('元レイヤの復元に警告: '+errText(e2));}
}
function keepIncomplete(){
    if(!output)return;
    try{output.name=uniqueName(doc,'Runner_v3_INCOMPLETE');}catch(e){if(logging()) record('未完成名への変更失敗: '+errText(e));}
    function unlock(l){try{l.locked=false;l.visible=true;}catch(e){if(logging()) record('未完成レイヤ表示失敗: '+errText(e));}var i;for(i=0;i<l.layers.length;i++)unlock(l.layers[i]);}
    unlock(output);if(logging()) record('未完成を保持: '+output.name+' / 完成品として使用しない');
}
function viewFrame(data,c){
    var v=doc.views[0],b=v.bounds,pad=c.frameWidth/2+c.border,f=data.frame,
        w=f[2]-f[0]+2*pad,h=f[1]-f[3]+2*pad,bw=Math.abs(b[2]-b[0]),bh=Math.abs(b[1]-b[3]),z=v.zoom;
    if(!isFinite(z)||z<=0||bw<=0||bh<=0||w<=0||h<=0)throw new Error('ビュー寸法を取得できません');
    var zoom=Math.max(.01,Math.min(64,z*.85*Math.min(bw/w,bh/h)));
    v.zoom=zoom;v.centerPoint=[(f[0]+f[2])/2,(f[1]+f[3])/2];if(logging()) record('外枠へビュー移動: zoom='+zoom.toFixed(4)+' / 中心='+v.centerPoint);
}
// Output notes are best-effort; never wait for a post-output modal window.
function storeResult(text){
    var l=null;
    try{
        l=layer(output,'06_result');l.locked=false;l.visible=true;
        var t=l.textFrames.add();t.name='RunnerMaker_Result';t.contents=text;
        t.position=planned?[planned.frame[0],planned.frame[1]]:[0,0];t.selected=false;
        try{var ca=t.textRange.characterAttributes;ca.size=10;ca.fillColor=gray(0);}catch(styleError){}
        l.visible=false;l.locked=true;return true;
    }catch(e){
        if(l)try{l.name='06_result__WRITE_FAILED';l.visible=false;l.locked=false;}catch(layerError){}
        if(logging())record('結果のレイヤー記録に失敗: '+errText(e));return false;
    }finally{restore();}
}
function finish(status,body){
    step('結果記録');if(logging()) record('最終状態: '+status);if(logging()) record(body);
    resultText='RunnerMaker v3.2-fast2\n状態: '+status+'\n'+(output?'出力レイヤ: '+output.name+'\n':'新規出力レイヤ: なし\n')+'\n'+body;
    if(logFile)resultText+='\n\n詳細ログ: '+logFile.fsName;
    else if(logIssue)resultText+='\n\n任意ログを保存できませんでした（生成の条件には含めません）: '+logIssue;
    var shortText='状態: '+status+'\n',good=complete&&output;
    if(good){shortText+=(planned?planned.parts.length+'パーツ / 接続 '+planned.gates.length+'本\n':'')+'出力レイヤ: '+output.name+'\n原本は変更していません。';
        if(config&&config.action==='preview')shortText+='\n黒い簡易線画です。完成出力は「生成」を使ってください。';
        else shortText+='\nパーツを含むランナーを生成しました。元レイヤ・旧出力の目を消すと確認できます。';
        if(planned&&(planned.missing.length||planned.unlinked.length))shortText+='\n接続不足は追加せず、そのまま出力しました（06_resultを参照）。';
        if(status!=='生成完了'&&status!=='プレビュー完了')shortText+='\n表示などの後処理で警告がありました。出力は保持しています。06_resultを確認してください。';
    }else shortText+=body.split('\n\n')[0];
    if(logIssue)shortText+='\n任意ログは保存できませんでした。生成・停止の判断とは別です。';
    if(output){
        // This must not open Window, alert, confirm or a file picker after drawing.
        storeResult(shortText+'\n\n--- 詳細 ---\n'+resultText);return;
    }
    try{alert(shortText);}catch(e){if(logging())record('停止理由の表示に失敗: '+errText(e));}
}

function main(){
    startLog();
    if(!app.documents.length){finish('出力前に停止','ドキュメントを開いてください。');return;}
    try{
        doc=app.activeDocument;originalLayer=doc.activeLayer;originalSelection=doc.selection;
        progressOpen('パーツ・輪郭を読み取り中');var input=readInput();progressClose();if(logging()) record('有効パーツ: '+input.parts.length+' / 除外: '+input.skipped);
        config=settings(input);
        if(!config){restore();if(logging()) record('最終状態: キャンセル・出力なし');return;}
        if(config.logDetails)chooseLog();progressOpen('計算を開始中');
        if(logging()) record(configText(config));step('配置・概形・共有経路の計算');var start=new Date().getTime();
        planned=RunnerCore.plan(input.parts,config,logging()?function(event){if(logging()) record('配置候補 '+event.attempt+' / '+event.stage+' / 追加余裕 '+(event.spare/(72/25.4)).toFixed(2)+'mm'+(event.stage==='done'?' / 不足方向='+event.deficit+' / 外枠未接続='+event.unlinked:''));}:null,restWork,coreWork);var calc=new Date().getTime()-start;summary=report(planned,input);if(config.frameRatio){var outerPad=config.frameWidth+2*config.border,unitScale=config.unit==='mm'?72/25.4:1;summary+='\n外枠の外側寸法（黒フチ込み）: '+((planned.frame[2]-planned.frame[0]+outerPad)/unitScale).toFixed(2)+' × '+((planned.frame[1]-planned.frame[3]+outerPad)/unitScale).toFixed(2)+' '+config.unit+'\n';}
        if(logging()) record('計画の外枠中心線 L/T/R/B（pt）: '+planned.frame.join(', '));if(logging()) record(summary);
        // Ignore connection deficits: draw only valid planned paths; no retry or forced route.
        step('描画予定の事前検査');var prepared=prepareDraw(planned,config);input.parts=null;releaseGeometry(planned);restWork();if(logging()) record('描画予定の事前検査完了');
        step('出力レイヤ作成');output=doc.layers.add();output.name=uniqueName(doc,config.action==='preview'?'Runner_v3_preview':'Runner_v3');
        output.locked=false;output.visible=true;output.zOrder(ZOrderMethod.BRINGTOFRONT);if(logging()) record('出力ルート: '+output.name);
        render(output,planned,config,prepared);prepared=null;
        complete=true;if(logging()) record('描画・複製完了（この時点で出力を保持）');restore();
        var warnings=[];
        if(config.fitView){step('外枠全体の表示');try{viewFrame(planned,config);}catch(e){warnings.push('外枠の表示位置調整: '+errText(e));if(logging()) record(warnings[warnings.length-1]);}}
        // No forced synchronous redraw: Illustrator redraws after this script returns.
        var body=configText(config)+'\n\n'+summary+'\n今回の実測: 計算 '+(calc/1000).toFixed(2)+'秒 / 描画・複製等 '+((new Date().getTime()-start-calc)/1000).toFixed(2)+'秒'+
            '\n原本・旧出力は残しています。出力だけを見る場合は、元レイヤ・旧出力を手動で非表示にしてください。'+
            (config.action==='preview'?'\n黒線のランナーとパーツの外接矩形です。原画は複製しません。赤枠は接続不足。':'\n幹は線、テーパーは塗りパスです。単一の加工用外形ではありません。');
        if(planned.missing.length||planned.unlinked.length)body+='\n接続条件の不足があります。番号別結果を確認してください。';
        if(warnings.length)body+='\n表示後処理の警告（出力は削除していません）:\n'+warnings.join('\n');
        finish(warnings.length?'描画完了・表示に警告':(config.action==='preview'?'プレビュー完了':'生成完了'),body);
    }catch(e){
        progressClose();var at=phase,detail='処理: '+at+(current?'\n対象: '+current:'')+'\n'+errText(e)+(e.line?'\n参考行: '+e.line:'');if(logging()) record('例外: '+detail);
        if(output&&!complete)keepIncomplete();
        restore();
        // Do not re-enter view/redraw APIs while recovering from an output error.
        finish(output?(complete?'描画完了・後続処理にエラー':'未完成・途中出力を保持'):'出力前に停止',detail+'\n'+
            (output?(complete?'描画済みの出力は保持しています。':'途中の図形は未完成レイヤに保持しています。完成品として使用しないでください。'):'新規出力はまだ作成していません。原本・以前の出力は保持しています。')+
            '\n\n'+(config?configText(config):'設定は未確定です。')+'\n\n'+summary);
    }
}
// Hide only the original active layer after a completed generation.
// Run after result recording so restore() cannot reactivate a hidden layer.
function hideSourceAfterGeneration(){
    if(!complete||!output||!config||config.action==='preview'||!originalLayer)return;
    try{
        doc.selection=null;
        doc.activeLayer=output;
        originalLayer.visible=false;
    }catch(e){
        // A display failure must never invalidate or delete completed artwork.
        restore();
        if(logging())record(errText(e));
    }
}
try{main();}finally{try{hideSourceAfterGeneration();}finally{progressClose();}}

})();
