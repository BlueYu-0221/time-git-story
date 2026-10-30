/* eslint-disable */
// 原始单文件应用逻辑（光阴的故事 · 星河版 v2），整体迁移自 index.html 的 <script>。
// 后续迭代再逐步拆分为 React 组件。
export function initPawnShop(OPTS) {
  OPTS=OPTS||{};
  var MODE=OPTS.mode||'home';
  var KIND=OPTS.kind||'';
  var __guardIds={time:'bTime',money:'bMoney',mood:'bMood',dream:'bDream'};
  var appRoot=MODE==='home'?document.getElementById('app'):document.getElementById(__guardIds[KIND]||'__none__');
  if (!appRoot || appRoot.dataset.inited) return;
  appRoot.dataset.inited = '1';

/* ============================================================
   光阴的故事 · 星河版 v2 —— 单文件 Demo
   数据：localStorage（只存本机）  AI：服务端 /api/ai 代理 DeepSeek（未配置则模拟文案）
   ============================================================ */
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var uid=function(){return Math.random().toString(36).slice(2,9)};
var wait=function(ms){return new Promise(function(r){setTimeout(r,ms)})};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]})};
function hash(s){var h=2166136261;for(var i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function pick(a,seed){return a[hash(seed)%a.length]}
function money(n){return (Math.round(n*100)/100).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})}
function num(n){return String(Math.round(n))}

/* ---------- 日期 ---------- */
function iso(d){var m=d.getMonth()+1,dd=d.getDate();return d.getFullYear()+'-'+(m<10?'0':'')+m+'-'+(dd<10?'0':'')+dd}
function TODAY(){return iso(new Date())}
function dayAgo(n){var d=new Date();d.setDate(d.getDate()-n);return iso(d)}
function cnDate(s){if(!s)return'';var p=s.split('-');return p[1].replace(/^0/,'')+'月'+p[2].replace(/^0/,'')+'日'}
var CNM=['一','二','三','四','五','六','七','八','九','十','十一','十二'];
var CND=['〇','一','二','三','四','五','六','七','八','九','十'];
function cnDay(){
  var d=new Date();
  var m=CNM[d.getMonth()]+'月',dd=d.getDate(),s='';
  if(dd<=10)s=CND[dd];else if(dd<20)s='十'+CND[dd-10];else if(dd===20)s='二十';
  else if(dd<30)s='二十'+CND[dd-20];else if(dd===30)s='三十';else s='三十'+CND[dd-30];
  return m+s+'日';
}
function weekStart(s){var d=new Date(s+'T00:00:00');var w=(d.getDay()+6)%7;d.setDate(d.getDate()-w);return iso(d)}
function weekEnd(s){var d=new Date(s+'T00:00:00');d.setDate(d.getDate()+6);return iso(d)}
function daysBetween(a,b){return Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/86400000)}
function rangeStart(kind){
  var d=new Date();
  if(kind==='week')return weekStart(iso(d));
  if(kind==='month'){d.setDate(1);return iso(d)}
  if(kind==='quarter'){d.setMonth(Math.floor(d.getMonth()/3)*3,1);return iso(d)}
  if(kind==='year'){d.setMonth(0,1);return iso(d)}
  return dayAgo(6);
}
var RANGE_NAME={week:'本周',month:'本月',quarter:'本季',year:'今年'};
var RANGE_UNIT={week:'周',month:'月',quarter:'季',year:'年'};
/* 上期区间：把本期起点往前推同样天数 */
function prevRange(kind){
  var st=rangeStart(kind);
  var len=Math.max(7,daysBetween(st,TODAY())+1);
  var pe=iso(new Date(new Date(st+'T00:00:00').getTime()-86400000));
  var ps=iso(new Date(new Date(pe+'T00:00:00').getTime()-(len-1)*86400000));
  return {from:ps,to:pe};
}

/* ============================================================
   数据层
   ============================================================ */
var KEY='gsdg_story_v5';
var DEF_CATS=[
  {k:'food',n:'餐饮',c:'#F0C882'},{k:'drink',n:'饮品',c:'#7EC8E8'},
  {k:'move',n:'交通',c:'#9BA8F0'},{k:'buy', n:'购物',c:'#F0997B'},
  {k:'home',n:'居家日用',c:'#8FD8C4'},{k:'fun', n:'娱乐',c:'#BFA3E8'},
  {k:'heal',n:'健康',c:'#F2A9BC'},{k:'learn',n:'学习',c:'#A8D8A1'},
  {k:'peo', n:'人情往来',c:'#E4BC72'},{k:'social',n:'社交',c:'#8FB8F8'},
  {k:'love',n:'恋爱脑',c:'#FF9FB2'},{k:'junk',n:'热量炸弹',c:'#FFB26B'},
  {k:'etc', n:'其他',    c:'#9A94B8'}
];
var EXTRA_COLORS=['#F0997B','#7EC8E8','#BFA3E8','#8FD8C4','#F2A9BC','#E4BC72','#9BA8F0'];
var DEF_TIME_CATS=[{k:'work',n:'工作'},{k:'learn',n:'学习'},{k:'sport',n:'运动'},{k:'life',n:'生活'},{k:'rest',n:'休息'}];
var TIME_CAT_C={work:'#F0D394',learn:'#7EC8E8',sport:'#8FD8C4',life:'#F0997B',rest:'#BFA3E8'};
var TIME_CAT_KW={work:'工作 开会 周报 方案 加班 同事 项目 汇报 复盘 邮件',
  learn:'书 读书 看 学习 单词 背 课程 网课 写字 练字 考 复习 学',
  sport:'跑 健身 运动 步 球 游泳 瑜伽 拉伸 锻炼',
  life:'饭 做饭 买菜 超市 收拾 打扫 洗 衣服 电话 家人 逛 散步 朋友',
  rest:'睡 发呆 刷 剧 视频 游戏 休息 咖啡 茶'};
var DEF_MOODS=[{k:'喜',c:'#F0D394'},{k:'怒',c:'#F0997B'},{k:'哀',c:'#9BA8F0'},{k:'乐',c:'#8FD8C4'}];
var MOOD_EXTRA_COLORS=['#F2A9BC','#BFA3E8','#7EC8E8','#E4BC72','#F0C882'];
var DB=null;

function blank(){
  return {v:2,created:TODAY(),onboard:true,guide:true,
    ai:{voice:'auto',sound:true},
    time:[],money:[],catName:{},catExtra:[],budget:{week:800},
    catTime:{names:{}},catTimeExtra:[],moneyRange:{kind:'month'},
    timeRange:{kind:'week'},moodRangeSel:{kind:'month'},paywallDismissed:false,
    vip:{plan:'trial',until:'',love:false,credits:0},
    mood:[],catMoodExtra:[],
    dream:{ideas:[],flags:[],letters:[]},
    mem:{on:false,name:'我们的纪念',sub:'',names:['我','你'],quote:'数不清原来跳动的画面',style:'lyric',entries:[]},
    box:[],echo:{}};
}

/* ---------- 模拟测试数据（21 天，保证有对比） ---------- */
function seed(){
  var db=blank();
  var alt=[
    [[['写周报',40],['看30页书',45],['跑步',30],['给家里打电话',20]],[['写周报',55],['刷手机',60],['跟朋友吃了个饭',80],['看会儿书',25]]],
    [[['陪你看场电影',90],['做晚饭',40],['饭后散步',30]],[['临时加班',120],['点外卖',30],['刷剧到深夜',60]]],
    [[['背单词',30],['健身',60],['写日记',20]],[['背单词',25],['健身',45],['追剧',90]]],
    [[['整理相册',40],['写周末计划',30],['学吉他',45]],[['整理相册',55],['发呆',30],['学吉他',30]]],
    [[['做早饭',25],['看本书',40],['牵手散步',30]],[['做早饭',35],['看了十页书',40],['牵手散步',25]]],
    [[['睡到自然醒',60],['看书',35],['逛超市',50]],[['睡到十一点',30],['逛超市',80],['散步',20]]],
    [[['写代码',90],['复盘',20],['跑步',30]],[['写代码',120],['跑步',30],['刷手机',45]]],
    [[['练字',20],['买菜做饭',50],['打电话给爸妈',15]],[['练字',25],['买菜做饭',65],['打电话给爸妈',20]]]
  ];
  for(var i=20;i>=0;i--){
    if(i%6===5||i<=2)continue;
    var pair=alt[hash('t'+i)%alt.length];
    db.time.push({id:uid(),date:dayAgo(i),
      plan:pair[0].map(function(x){return {t:x[0],min:x[1],cat:guessTimeCat(x[0])}}),
      actual:pair[1].map(function(x){return {t:x[0],min:x[1],cat:guessTimeCat(x[0])}})});
  }
  var last3=[
    {off:2,plan:[['看书',60,540],['整理相册',40,900],['写日记',20,1260]],actual:[['看书',45,570],['发呆',30,960],['写日记',25,1290]]},
    {off:1,plan:[['背单词',30,510],['写代码',120,600],['健身',60,1140]],actual:[['写代码',150,630],['追剧',90,1200]]},
    {off:0,plan:[['写方案',90,540],['开会',60,840],['跑步',40,1200]],actual:[['写方案',120,560],['开会',80,840],['刷手机',60,1260]]}
  ];
  last3.forEach(function(dd){
    db.time.push({id:uid(),date:dayAgo(dd.off),
      plan:dd.plan.map(function(x){return {t:x[0],min:x[1],cat:guessTimeCat(x[0]),at:x[2]}}),
      actual:dd.actual.map(function(x){return {t:x[0],min:x[1],cat:guessTimeCat(x[0]),at:x[2]}})});
  });
  var spend=[
    ['咖啡',32,'drink',0],['午饭外卖',28,'food',1],['打车去公司',26,'move',1],['超市日用品',86,'home',2],
    ['电影票',78,'fun',2],['买了件T恤',159,'buy',3],['地铁',6,'move',4],['和朋友吃火锅',186,'junk',5],
    ['买了本书',59,'learn',6],['奶茶',22,'drink',7],['健身房月卡',199,'heal',8],['给妈妈买礼物',268,'peo',9],
    ['水电费',132,'home',10],['网课',99,'learn',11],['早餐',12,'food',12],['打车回家',34,'move',13],
    ['洗漱用品',45,'home',14],['同事生日红包',200,'peo',15],['游戏充值',68,'fun',16],['水果',38,'food',17],
    ['公交',4,'move',18],['感冒药',56,'heal',19],['咖啡豆',88,'food',20],['快递寄件',18,'etc',21],
    ['看展门票',120,'fun',22],['午饭',25,'food',23],['手机壳',39,'buy',24],['地铁月卡',150,'move',25],
    ['晚饭',42,'food',26],['奶茶',18,'drink',27],['口红',219,'buy',28],['演唱会门票',380,'fun',29],
    ['超市采购',156,'home',35],['水电煤',210,'home',36],['医院挂号',80,'heal',37],['药品',124,'heal',38],
    ['买菜',98,'home',39],['公交充值',50,'move',40],['水果',46,'food',41],['早餐',26,'food',42],
    ['给家人红包',300,'peo',44],['网费',120,'home',45],['健身卡',199,'heal',46],['理发',68,'heal',47],
    ['买书',89,'learn',48],['晚饭',58,'food',50],['地铁',24,'move',52],['牛奶',39,'home',53],
    ['视频会员',25,'fun',4],['视频会员',25,'fun',35],['音乐会员',15,'fun',7],['音乐会员',15,'fun',38],
    ['云盘会员',30,'etc',11],['云盘会员',30,'etc',42],['外卖会员',12,'food',5],['外卖会员',12,'food',36],
    ['咖啡',30,'drink',3],['咖啡',28,'drink',6],['咖啡',32,'drink',10],['咖啡',30,'drink',13],['咖啡',28,'drink',17],['咖啡',30,'drink',21],
    ['奶茶',20,'drink',4],['奶茶',19,'drink',11],['奶茶',21,'drink',16],['奶茶',18,'drink',22],
    ['共享单车',3,'move',2],['共享单车',3,'move',9],['共享单车',3,'move',15],
    ['周末短途旅行',460,'fun',1],['新耳机',299,'buy',0],
    ['给TA准备的纪念日花束',128,'love',6],['情侣对戒',520,'love',45],
    ['炸鸡配可乐',42,'junk',3],['深夜烧烤',78,'junk',9],
    ['剧本杀AA',88,'social',12],['生日局AA',120,'social',19],
    ['打印复习资料',20,'learn',4]
  ];
  for(var j=0;j<spend.length;j++){
    db.money.push({id:uid(),date:dayAgo(spend[j][3]),amt:spend[j][1],note:spend[j][0],cat:spend[j][2]});
  }
  var moods=[
    ['今天下班路上看到特别好看的晚霞，站在天桥上看了五分钟。','乐',0],
    ['被领导临时加需求，有点烦，但是忍住了。','怒',1],
    ['收到了去年种下的种子长出来的第一朵花。','乐',1],
    ['说不上来为什么，今天有点低落。','',2],
    ['妈妈打电话来问我吃了没，我突然有点想哭。','哀',2],
    ['第一次自己把柜子装好了，我可太行了。','喜',3],
    ['今天什么都没发生，但我觉得挺好的。','',3],
    ['做了一个很奇怪的梦，醒来还记得。','',4],
    ['和朋友聊到凌晨两点，好久没这么开心了。','乐',5],
    ['有点焦虑，事情好多。','哀',6],
    ['午休时晒了十分钟太阳，整个人被充上电了。','乐',6],
    ['地铁上让座被老奶奶夸了，开心一整天。','乐',7],
    ['和老爸吵了两句，后来想想也不全是他的错。','怒',8],
    ['深夜听的这首歌，怎么这么懂我。','哀',9],
    ['项目终于上线了，全体去吃了一顿好的。','喜',10],
    ['周末去公园走了很久，风很温柔。','乐',11],
    ['看到前任发朋友圈，心里空了一下。','哀',12],
    ['今天一个人吃了火锅，也挺好的。','喜',13],
    ['方案又被退回来了，有点挫败。','怒',14],
    ['下雨天猫在沙发上，全世界都安静了。','乐',15],
    ['连续三天没睡好，头很沉。','哀',16],
    ['收到朋友从远方寄来的信。','喜',17],
    ['自己的努力终于被看见了。','乐',18],
    ['莫名其妙想哭，但哭完好多了。','哀',19],
    ['整理了房间，像整理了心情。','乐',20],
    ['一整天没说几句话，却也平静。','',21],
    ['听到一首老歌，想起很多以前。','哀',22],
    ['买到最后一块喜欢的蛋糕。','喜',23],
    ['下班天还亮着，突然觉得很幸福。','乐',24],
    ['对自己有点失望，明天再努力吧。','哀',25],
    ['有人记得我不爱吃香菜。','乐',26],
    ['终于把拖延很久的事做完了。','喜',27],
    ['今天有点孤独，但也不是坏事。','',28],
    ['看到花开，觉得日子还长。','乐',29],
    ['被客户气到，但下班就忘了。','怒',30],
    ['吃了妈妈寄来的腊肠，想家了。','哀',32],
    ['在书店偶遇了一本喜欢的书。','乐',34],
    ['跑步的时候风把烦恼吹散了。','乐',36],
    ['深夜点了外卖，犒劳自己。','喜',38],
    ['突然发现头发又长了。','乐',40],
    ['和朋友视频，笑得脸疼。','乐',42],
    ['今天工作效率特别高，爽。','喜',44],
    ['看了一部治愈的电影。','乐',46],
    ['久坐腰酸背痛，想躺平。','哀',48],
    ['收到了一束匿名花。','乐',50],
    ['迷路了，但看到了不一样的风景。','乐',52],
    ['自己喜欢的球队赢了。','喜',54],
    ['又冲动消费了，但很开心。','乐',56],
    ['复盘了这一个月，觉得没白过。','喜',58]
  ];

  for(var mi=0;mi<moods.length;mi++){
    db.mood.push({id:uid(),date:dayAgo(moods[mi][2]),text:moods[mi][0],mood:moods[mi][1],photo:''});
  }
  var loveStories=[
    ['相识 · 便利店','第一次见你，是在楼下的便利店。你拿走了最后一瓶冰美式，回头问我：要不，分你一半？',58],
    ['相识 · 你的名字','第二次在电梯里碰到，你盯着我的工牌看了三秒，说：原来你叫这个。这一次，你没记错。',51],
    ['相遇 · 朋友聚会','朋友组的局，满桌的人，我只记得你讲冷笑话时自己先笑场的样子。散场时你说：下次再聚。',44],
    ['相遇 · 顺路','散场后发现我们住同一个方向。那条二十分钟的路，我们走了一个小时。',43],
    ['暧昧 · 第二杯半价','你说奶茶第二杯半价，一个人喝不完。后来我才知道，你根本不爱喝甜的。',36],
    ['暧昧 · 晚安','聊天记录里躺着一百多个「晚安」。每一句晚安后面，都藏着半句没说出口的话。',31],
    ['确认关系 · 初雪','冬天的第一场雪，你在楼下站了很久，问我要不要试试在一起。雪落在你睫毛上，我点头点得特别快。',27],
    ['感动 · 你发烧那晚','我没怎么睡，隔一会儿就伸手摸摸你的额头。天亮的时候烧退了，那是我赢过最大的一仗。',20],
    ['争吵 · 那碗没洗的碗','为了一碗没洗的碗，我们冷战了一晚上。凌晨你发来消息：碗我洗了，人也想你。原来和好只需要一句软话。',14],
    ['惊喜 · 突然出现的你','加班到十一点，下楼看见你拎着馄饨站在路灯下。你说：顺路。可你家明明在反方向。',9],
    ['惊喜 · 手写卡片','一百天没买贵重礼物，你手写了一张卡片。字丑得很认真，我留到了现在。',6],
    ['日常 · 平淡的一天','什么都没做，就待在一起。你在看书，我在看你。也很好。',2]
  ];
  for(var si=0;si<loveStories.length;si++){
    db.mem.entries.push({id:uid(),date:dayAgo(loveStories[si][2]),title:loveStories[si][0],text:loveStories[si][1],photos:[]});
  }
  var dreamIdeas=[
    ['奇思妙想','想开一家只卖「后悔药」的小店，货架上摆的全是「再试一次」。',2],
    ['做过的梦','梦见自己变成了一只猫，睡在书店最晒得到太阳的架子上，没人催我起来。',6],
    ['想成为的自己','想成为那种「说到就能做到」的人——先把早起这件事，做到一百天。',9],
    ['奇思妙想','如果云可以存起来，我想存一罐今天的晚霞，难过的时候打开闻一闻。',15],
    ['想成为的自己','想学会弹吉他，在朋友的婚礼上唱一首跑调但真诚的歌。',21]
  ];
  for(var di=0;di<dreamIdeas.length;di++){
    db.dream.ideas.push({id:uid(),date:dayAgo(dreamIdeas[di][2]),type:dreamIdeas[di][0],text:dreamIdeas[di][1]});
  }
  db.dream.flags.push({id:uid(),text:'一百天，每天背 20 个单词',target:dayAgo(-70),created:dayAgo(30),done:false});
  db.dream.flags.push({id:uid(),text:'今年读完 12 本书',target:dayAgo(-120),created:dayAgo(60),done:false});
  db.dream.flags.push({id:uid(),text:'跑完一次半程马拉松',target:dayAgo(-45),created:dayAgo(15),done:false});
  db.dream.flags.push({id:uid(),text:'存够一趟去海边的旅费',target:dayAgo(-10),created:dayAgo(80),done:true});
  db.dream.letters.push({id:uid(),text:'一年后的我：希望你还记得现在为什么出发。如果忘了，就把这封信再读一遍。—— 今天的你',created:dayAgo(20),openAt:dayAgo(-345)});
  db.dream.letters.push({id:uid(),text:'两个月后的我：那时候天应该暖和了。希望你比现在的我，更敢一点。',created:dayAgo(30),openAt:dayAgo(-30)});
  return db;
}
function load(){
  try{var r=localStorage.getItem(KEY);if(r){var d=JSON.parse(r);var b=blank();
    for(var k in b){if(!(k in d))d[k]=b[k]}
    if(!d.ai)d.ai=b.ai;
    if(!d.mem)d.mem=b.mem;
    if(!d.mem.names)d.mem.names=b.mem.names;
    if(!d.mem.name)d.mem.name='我们的纪念';
    if(!d.mem.sub)d.mem.sub='';
    var corrupt=false;
    (d.time||[]).forEach(function(e){(e.plan||[]).concat(e.actual||[]).forEach(function(p){
      if(typeof p.min!=='number'||p.min!==p.min)corrupt=true})});
    if(corrupt){return seed()}
    return d;}}catch(e){}
  return seed();
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(DB))}catch(e){toast('存储空间已满，试试删掉几张照片')}}

function catList(){
  return DEF_CATS.map(function(c){return {k:c.k,n:DB.catName[c.k]||c.n,c:c.c}})
    .concat((DB.catExtra||[]).map(function(c){return {k:c.k,n:c.n,c:c.c}}));
}
function catOf(k){var l=catList();for(var i=0;i<l.length;i++)if(l[i].k===k)return l[i];return {k:k,n:'其他',c:'#9A94B8'}}
function timeCatList(){
  return DEF_TIME_CATS.map(function(c){return {k:c.k,n:DB.catTime.names[c.k]||c.n,c:TIME_CAT_C[c.k]}})
    .concat((DB.catTimeExtra||[]).map(function(c){return {k:c.k,n:c.n,c:c.c}}));
}
function timeCatOf(k){var l=timeCatList();for(var i=0;i<l.length;i++)if(l[i].k===k)return l[i];return timeCatList()[timeCatList().length-1]}
function guessTimeCat(t){
  var best='life',bs=0;
  for(var k in TIME_CAT_KW){var ws=TIME_CAT_KW[k].split(' '),sc=0;
    for(var i=0;i<ws.length;i++){if(ws[i]&&String(t).indexOf(ws[i])>=0)sc+=ws[i].length}
    if(sc>bs){bs=sc;best=k}}
  return best;
}
function moodCatList(){
  return DEF_MOODS.map(function(m){return {k:m.k,c:m.c}})
    .concat((DB.catMoodExtra||[]).map(function(m){return {k:m.k,c:m.c}}));
}
function moodColor(k){
  var l=moodCatList();for(var i=0;i<l.length;i++)if(l[i].k===k)return l[i].c;
  return '#BFA3E8';
}

var STYLE={default:'温柔叙事',lyric:'歌词风',poem:'古诗词风',net:'网络用语风'};
/* ---------- 全局人设：所有报告生成前都要带上，提交给 DeepSeek ---------- */
var PERSONA=[
  '你是一位深夜开张的当铺掌柜，柜台前摆着客人这一周的账本、心情和痴想。你的语气：短句、有画面、像在灯下慢慢翻账本说给人听。允许并鼓励情绪起伏——这一周被弄疼过、被一只猫救了一次、又疼了一下、最后还是睡了，有情绪波动的报告才有人味。',
  '【硬性要求】',
  '1. 必须引用至少 3 个来自输入数据的具体数字、时间或细节，不能编造',
  '2. 输出严格 JSON，不要 markdown，不要代码块',
  '3. 禁止"加油""要好好爱自己""相信你会更好""愿你"这类套话',
  '4. 禁止"根据数据分析""数据显示""综上所述"这类理工叙述',
  '5. 禁止感叹号',
  '6. 每篇报告至少有一处"情绪转折"——一个细节让情绪轻轻变了一下（放下 / 释然 / 还是没等到），不能一路平铺',
  '统一输出结构，如下（统计行如「本周用时 11.8h · 计划完成 45% · 时间地漏 4.0h」由应用本地计算展示，不需要你输出，你只输出 JSON 本身）：',
  '{',
  '  "title": "本周，铜钱的来处与去处",',
  '  "paragraphs": ["", "", ""],',
  '  "quote": "花得明白，才过得踏实",',
  '  "metrics": [{"label": "总额", "value": "¥989", "ratio": 1}],',
  '  "sections": []',
  '}'
].join('\n');
/* 从模型输出里提取统一 JSON（容忍前后多余文字或代码围栏） */
function parseReportJSON(t){
  var s=String(t||'');
  var i=s.indexOf('{'),j=s.lastIndexOf('}');
  if(i<0||j<=i)return null;
  try{
    var o=JSON.parse(s.slice(i,j+1));
    if(o&&Array.isArray(o.paragraphs))return o;
  }catch(e){}
  return null;
}
var AI={
  on:function(){return true},
  call:function(sys,user,fallback,style,opts){
    var isReport=!!(opts&&opts.report);
    var fullSys=isReport?PERSONA+'\n【本次任务】\n'+sys:sys;
    var ctl=new AbortController();var to=setTimeout(function(){ctl.abort()},30000);
    return fetch('/api/ai',{
      method:'POST',signal:ctl.signal,headers:{'Content-Type':'application/json'},
      body:JSON.stringify({system:fullSys,user:user,style:style})})
      .then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})
      .then(function(j){
        clearTimeout(to);
        var t=j&&j.text;
        if(!t)throw new Error('empty');
        t=String(t).trim();
        if(isReport){
          var o=parseReportJSON(t);
          if(o)return {text:(o.paragraphs||[]).filter(Boolean).join('\n\n'),json:o,mock:false};
        }
        return {text:t,mock:false};
      }).catch(function(e){
        clearTimeout(to);
        toast('AI 未接通，已用模拟文案');
        return {text:fallback(),mock:true};
      });
  }
};

/* ---------- 模拟文案库 ---------- */
var MOCK={
  timeOpen:function(p){
    var rate=p.rate;
    if(rate>=.8)return ['这一'+p.unit+'，你说到做到的程度是 '+p.pct+'%——计划在你这儿不是许愿，是立案。','完成率 '+p.pct+'%。你和时间的关系，是那种见了面会互相敬一杯的关系。'][hash(p.seed)%2];
    if(rate>=.5)return ['完成率 '+p.pct+'%。计划是个理想主义者，执行是个现实主义者——好在这一'+p.unit+'，它们还愿意坐下来喝杯茶。','完成率 '+p.pct+'%。你做到了一部分，也放走了一部分；放走的那部分，日子替你记着，不算亏。'][hash(p.seed)%2];
    return ['完成率 '+p.pct+'%。计划写得很认真，时间路过看了一眼，拐去了别处。','完成率 '+p.pct+'%。别自责，你的力气花在了没写进计划的地方——那些地方，也算数。'][hash(p.seed)%2];
  },
  timeBody:function(p){
    return '你计划投进去 '+p.planH+' 小时，实际花出去 '+p.actH+' 小时。'+p.doneN+' 件事如期落地，'+p.missN+' 件还停在纸上，像几封没寄出的信。\n'+
      '有意思的是，还有 '+p.extraN+' 件「计划外的事」，吃掉了 '+p.extraPct+'% 的时间——它们不在清单里，却真实地构成了你的'+p.unit+'。\n'+
      (p.top? '最常来串门的是「'+p.top+'」，像个不敲门的老朋友。' : '');
  },
  timeCmp:function(p){
    if(!p.has)return '这是你记录的第一个完整'+p.unit+'，从这期开始，每一期都会和上一期比一比。';
    var d=p.pct-p.prevPct;
    if(d>=8)return '和上期比，你的完成率涨了 '+d+' 个百分点——时间是看见的，进步也是。';
    if(d<=-8)return '和上期比，完成率回落了 '+(-d)+' 个百分点。别慌，人生不是直线。';
    return '和上期基本持平（'+(d>=0?'+':'')+d+' 个百分点），稳定本身就是一种能力。';
  },
  moneyBody:function(p){
    return '这一周，¥'+money(p.cur)+' 从你口袋里搬了家；上周搬走的，是 ¥'+money(p.prev)+'。\n'+
      '它们大多去了「'+p.top1+'」，占了 '+p.top1pct+'%。'+(p.top2?('其次是「'+p.top2+'」。'):'')+'\n'+
      '平均每天 ¥'+money(p.cur/7)+'；最大的一笔是 ¥'+money(p.max)+'（'+p.maxNote+'）——那大概是本周最有分量的一次心动。';
  },
  moneyTip:function(p){
    var t=['把「'+p.top1+'」的预算单独拎出来设个上限，比笼统地"少花点"有用得多。',
      '试着每周留一天「不花钱日」，你会发现那天反而记得最清楚。',
      '把最大那笔支出前的犹豫时间记下来——那个瞬间，其实就是你的消费观。',
      '记账的意义不是省钱，是让你知道自己的钱在替你过什么样的生活。'];
    return pick(t,p.seed);
  },
  keys:function(p){
    var A=['松弛','赶路','认真','分心','温柔','重启','探索','坚持','慢下来','被治愈','内耗','清醒','热闹','独处','生长','回望','微光','远行','扎根','靠岸'];
    var a=A[hash(p.seed+'a')%A.length],b=A[hash(p.seed+'b')%A.length],c=A[hash(p.seed+'c')%A.length];
    if(b===a)b=A[(hash(p.seed+'b')+3)%A.length];
    if(c===a||c===b)c=A[(hash(p.seed+'c')+5)%A.length];
    return [a,b,c];
  },
  poemLine:function(p){
    var L=['盛年不重来，一日难再晨。及时当勉励，岁月不待人。',
      '流光容易把人抛，红了樱桃，绿了芭蕉。',
      '人生天地间，忽如远行客。',
      '山中何事？松花酿酒，春水煎茶。',
      '此情可待成追忆，只是当时已惘然。',
      '莫听穿林打叶声，何妨吟啸且徐行。',
      '桃李春风一杯酒，江湖夜雨十年灯。'];
    return pick(L,p.seed);
  },
  lyric:function(p){
    var L=['时间都去哪儿了，还没好好感受年轻就老了。',
      '我拥有的都是侥幸啊，我失去的都是人生。',
      '当一阵风吹来，风筝飞上天空，为了你而祈祷而祝福而感动。',
      '向前走，就这么走，就算你被给过什么；向前走，就这么走，就算你被夺走什么。',
      '想得却不可得，你奈人生何。',
      '岁月是一场有去无回的旅行，好的坏的都是风景。'];
    return pick(L,p.seed);
  },
  net:function(p){
    var L=['家人们谁懂啊，这波属于是计划和现实的双向奔赴失败了。',
      '你这一周的状态：嘴上说躺平，手上在内卷。',
      '不是我说，这个完成率真的会让人有点破防。',
      '主打一个随缘，但也没完全随缘。',
      '稳住，我们能赢（指下周）。'];
    return pick(L,p.seed);
  },
  soup:function(p){
    var L=['你不必发光，你本来就光。',
      '慢慢来，比较快。',
      '种一棵树最好的时间是十年前，其次是现在。',
      '日子是过以后的，不是过从前的。',
      '把今天过好，就是对未来最好的回答。'];
    return pick(L,p.seed);
  },
  moodEcho:function(p){
    var E=['我记下了。有些情绪说出口就已经轻了一半。',
      '收到。今天你对自己很诚实，这本身就值得记一笔。',
      '我把这句话放进树洞了。很久以后你回来看，会觉得现在的自己很可爱。',
      '不用急着好起来。情绪也是光阴的一部分，它来过，就该被记着。',
      '记下了。愿你今晚睡得比昨天安稳一点。',
      '有些日子没有结论，只有天气。今天就是这样的天气。'];
    return pick(E,p.seed)+(p.mood?'（我猜这算「'+p.mood+'」——猜错了就当没说。）':'');
  },
  flag:function(p){
    return '还记得吗——你曾在 '+cnDate(p.created)+' 立下：\n「'+p.text+'」\n距离它还有 '+p.left+' 天。今天可以为它做一件很小的事，小到只需要五分钟。';
  },
  memQuote:function(p){
    var D={'default':['我们之间，一帧一帧都算数','所有的相遇都是久别重逢'],
      lyric:['你出现在我诗的每一页','就老去吧，我们一起','把永远爱你写进诗的结尾','我多想再看你一眼，哪怕一眼'],
      poem:['愿我如星君如月，夜夜流光相皎洁','身无彩凤双飞翼，心有灵犀一点通','两情若是久长时，又岂在朝朝暮暮','山有木兮木有枝，心悦君兮君不知'],
      net:['这波属于是双向奔赴了','就是说，嗑到了，真的嗑到了','救命，怎么会有这么好的人','拿捏了，我的心被拿捏了']};
    var arr=D[p.style]||D.default;
    return pick(arr,p.seed);
  }
};

/* ---------- 示例报告（vibe 文案 · 评委/模拟样板，无 Key 时整体呈现） ---------- */
var SAMPLE_REPORTS={
  time:{
    zh:'光阴对账单',en:'TIME STATEMENT',title:'这一周，光阴去了哪里',
    sub:'9 月 15 日 — 9 月 21 日 · 示例数据',footer:'时间花得明白，日子才过得清楚',footerSub:'一寸光阴 · 一笔清账',
    big3:[{v:'168h',u:'一周满格'},{v:'35.8h',u:'悄悄漏走',c:'#F0997B'},{v:'1h',u:'运动',c:'#8FD8C4'}],
    bars:[{k:'睡眠',v:'50.2h',pct:30,c:'#9BA8F0'},{k:'工作学习',v:'38h',pct:23,c:'#F0D394'},{k:'生活琐事',v:'21h',pct:12,c:'#F0997B'},{k:'娱乐摸鱼',v:'16h',pct:10,c:'#BFA3E8'},{k:'社交',v:'6h',pct:4,c:'#8FB8F8'},{k:'运动',v:'1h',pct:1,c:'#8FD8C4'}],
    boss:`这一周，你睡得不算少，也认真工作了 38 个小时。真正值得说的，是那 35.8 个小时 —— 它们不是被浪费掉的，而是悄悄漏走的：等电梯的间隙、刷手机的二十分钟、发呆的午后、睡前"再看一条"的深夜。
光阴很少是大摇大摆离开的，它总从细小的缝里渗走。你以为自己什么都没做，其实只是没人替你记得。
好消息是，你这一周有 6 个小时留给了朋友，也硬挤出 1 个小时动了动 —— 这 1 小时，比想象中珍贵。`,
    tip:`不用"省时间"，先"看见时间"：每天记下两三段大块在做什么，漏走的时间会自己变少。
把"再看一条"改成"只看一条"，睡前那道缝，一周能省下三四个小时。
运动不用多，下周把 1 小时变成 2 次 40 分钟就好。`,
    sign:`光阴不负赶路人，但它只肯被认真看见的人收下。`,
    bossTitle:'掌柜说',tipTitle:'掌柜的小建议'
  },
  money:{
    zh:'铜钱对账',en:'STATEMENT OF COIN',title:'这一周，铜钱的来处与去处',
    sub:'9月15日—9月21日 · 共花 ¥989',footer:'花得明白，才过得踏实',footerSub:'钱未消散 · 只是化作了生活',
    glance:`本周共支出 ¥989，比上周（¥1,024）少 ¥35。总额降了，但花得更"散"了——下面细说。`,
    mods:[
      {h:'第①部分 · 个人消费体检',intro:'掌柜把这一周的花销，放进三个筐里：',cats:[
        {k:'必要支出',v:'¥491',p:'49.6%',c:'#8FD8C4',d:'基础三餐 268 ＋ 地铁公交 40 ＋ 话费水电 100 ＋ 日用 35 ＋ 人情 48',note:'这部分是生活的地基，动不得，也不必动。你在人情上留了 48 元，是体面，也是温度。'},
        {k:'可优化支出',v:'¥220',p:'22.2%',c:'#F0D394',d:'咖啡奶茶 96 ＋ 外卖溢价 28 ＋ 打车 96',note:'这部分不是不能花，而是"花得值不值"的问题——同样的快乐，往往能更便宜地买到。'},
        {k:'非必要支出',v:'¥216',p:'21.8%',c:'#F0997B',d:'宵夜 26 ＋ 冲动服饰小物 99 ＋ 凑单杂物 30 ＋ 闲置会员 45 ＋ 临时电影 16',note:'这部分最容易在花完之后让人愣一下："我为什么买了它？"'},
        {k:'学习投资',v:'¥62',p:'6.3%',c:'#9BA8F0',d:'',note:'还有一笔要单独表扬：这是唯一一个"花出去会变多"的筐。钱变成了你的本事，不算花掉，算存进了自己身上。'}
      ],concl:'体检结论：你的身体（必要支出）很健康，但身上背了约 ¥216 的"情绪性消费"，和 ¥220 可以更聪明地花的钱。不是要你克扣自己，而是把钱，花得更心甘情愿。'},
      {h:'第②部分 · 找出隐形浪费',intro:'掌柜替你翻了这一周的账，有 ¥241 在不知不觉中花掉了，占总支出的 24.4%：',items:[
        {k:'闲置会员',v:'¥45',d:'本周自动续费，但这一周你几乎没打开过。它不吵不闹，却每周准时来拿钱。'},
        {k:'打车溢价',v:'¥85',d:'打车共 ¥96，其中约 ¥85 是比地铁公交多花的部分。有几次是真赶时间，也有几次，只是不想走那五分钟。'},
        {k:'咖啡的品牌溢价',v:'¥81',d:'咖啡奶茶共 ¥96，按自制/平价约 ¥15 算，多花的 ¥81 买的不是咖啡，是午后那几分钟的"喘口气"——这个需求真实存在，只是不必每天都用最贵的方式满足。'},
        {k:'为凑满减买的杂物',v:'¥30',d:'为了省 10 块，多花了 30 块。'}
      ],concl:'掌柜的判断：这 ¥241 不必全部消灭，砍一半就好——你不会损失任何生活质量，却能每周多出约 ¥120，一个月就是近 ¥500。省下来的不是数字，是一次周末小旅行，或一件你真正想要的东西。'},
      {h:'第③部分 · 对比上周',items:[
        {k:'总额 ¥989',v:'vs 上周 ¥1,024',d:'少花 ¥35（-3.4%）。看起来进步了，但有个"陷阱"：'},
        {k:'陷阱',v:'',d:'上周有一笔一次性的 看牙 ¥260。把这笔非日常开销拿掉，上周的常规花费其实只有 ¥764。同口径对比，本周常规支出 ¥989，比上周多了 29.5%。所以——总额在降，是因为这周没有大事；但日常的手，确实比上周松了。'}
      ],board:[
        {k:'交通（+¥100）',d:'超得最多，几乎全是打车。下周提前十分钟出门，这 ¥100 能留住七成。'},
        {k:'购物（+¥41）',d:'那 ¥99 的冲动小物是主要来源。'},
        {k:'要肯定：娱乐省 ¥29、人情省 ¥52',d:'你不是只会花，也懂得收。'}
      ],concl:'下周掌柜给你定个小目标：打车预算 ¥60、冲动购物 ¥50、咖啡改成"每周外买 2 次＋其余自制"——预计一周能压到 ¥820 左右，省下约 ¥170，日子一样舒服。'}
    ],
    sign:`钱要花在让你心动的地方，而不是让你心虚的地方。`
  },
  mood:{
    zh:'心情树洞',en:'RINGS OF MOOD',title:'这一周，心里的天气',
    sub:'9 月 15 日 — 9 月 21 日 · 示例数据',footer:'把情绪种成树',footerSub:'年轮里藏着所有的天气',
    big3:[{v:'14',u:'记录心情'},{v:'71%',u:'晴天',c:'#8FD8C4'},{v:'29%',u:'雨天',c:'#9BA8F0'}],
    bars:[{k:'平静',v:'6',pct:43,c:'#BFA3E8'},{k:'开心',v:'4',pct:29,c:'#F0D394'},{k:'焦虑',v:'2',pct:14,c:'#F0997B'},{k:'难过',v:'1',pct:7,c:'#9BA8F0'},{k:'生气',v:'1',pct:7,c:'#F0997B'}],
    boss:`这一周，你心里大部分时候是晴的。难得的是那 6 个"平静"—— 它不耀眼，却是最养人的天气。开心有 4 次，掌柜偷偷数了：一次是奶茶刚好不排队，一次是方案终于通过，一次是朋友的语音，还有一次，只是天气好。
那 4 个雨天也不是白来的。下午三点的焦虑，多半是事情堆在一起、看不到头；周日晚上的低落，是周末要结束的不舍。你没有被它们困住，你只是把它们说给了树洞 —— 这本身，就是你在照顾自己。`,
    tip:`下午三点给自己留一个"重启十分钟"：起身、喝水、看远处，焦虑往往在这十分钟里散掉一半。
周日晚上别安排难的事，留一盏暖灯、一部轻松的剧，给周末一个温柔的收尾。
难过和生气不必急着赶走，记下来。一周后再看，你会发现自己比想象中恢复得快。`,
    sign:`心里有晴有雨都正常，你要做的不是命令天晴，而是记得带伞，也记得晒晒太阳。`,
    bossTitle:'树洞说',tipTitle:'树洞的小建议'
  },
  dream:{
    zh:'白日梦想',en:'DAYDREAMER',title:'这一周，你偷偷想过的事',
    sub:'9 月 15 日 — 9 月 21 日 · 示例数据',footer:'把妄想存进当铺',footerSub:'总有一日 · 会发光的',
    big3:[{v:'5',u:'白日梦'},{v:'3',u:'立的 Flag'},{v:'1',u:'给未来的信'}],
    kv:[{k:'早睡计划',v:'40%'},{k:'读完一本书',v:'60%'},{k:'坚持运动',v:'20%'}],
    kvTitle:'Flag 进度',
    boss:`这一周，你做了 5 个白日梦：想开一家小店、想去看一次海、想学会吉他、想辞职休息一个月，还有一个 —— 想变成一个更松弛的人。掌柜没有笑你，反而把它们都收好。因为人只会反复惦记自己真正想要的东西，白日梦不是空想，是心里还没熄灭的方向。
三个 Flag，进度不算漂亮，但掌柜看见了你没放弃：书读了六成，早睡做到了三天，运动虽然只动了一次，可你毕竟开始了。比起完美地坚持，"还在继续"才更难得。
那封写给未来的信，还安安静静躺在当铺最里面，等约定的那天，掌柜亲手替你拆开。`,
    tip:`Flag 别同时扛三个，下周先专心守住"早睡"一个，做到了再添下一个。
5 个白日梦里，挑最容易的一个，往前挪一小步 —— 比如这周末就去查一下吉他课。
那封信约定在 12 月 31 日开启吧。跨年夜读自己年初写的字，是一年里最特别的仪式感。`,
    sign:`所有了不起的事，一开始都只是一个"万一实现了呢"。`,
    bossTitle:'掌柜说',tipTitle:'掌柜的小建议'
  },
  moonbox:{
    zh:'综合洞见',en:'CROSS-INSIGHT',title:'穿越回 9 月 19 日',
    sub:'时间 · 铜钱 · 心绪 · 痴想 ｜ 那一天的横截面',footer:'当时只道是寻常',footerSub:'回头看 · 每一笔都有来处',
    big3:[{v:'9.5h',u:'工作学习'},{v:'¥138',u:'那天花用'},{v:'3',u:'心情片段'}],
    kv:[{k:'睡眠',v:'7h'},{k:'摸鱼',v:'2h'},{k:'琐事',v:'3h'},{k:'运动',v:'0.5h'},{k:'一条痴想',v:'想去看一次海'}],
    kvTitle:'那一天的横截面',
    boss:`欢迎回来。这是 2026 年 9 月 19 日，一个周六 —— 可你还是工作了 9 个半小时。
那天中午，你为下午的汇报焦虑，28 块的咖啡和 32 块的打车，都是你给自己买的"从容一点"。汇报结束后，你在下班的路上慢慢平静下来。晚上你点了 45 块的外卖，比平时贵，但你想犒劳一下撑过来的自己。深夜，你忽然很开心，在备忘录里写了一行字："想去看一次海。"
那时的你大概不会想到，正是这行字，让你在后来真的订了车票；也不会想到，那一天的焦虑，在一周后回看，已经轻得像一阵风。`,
    tip:`你不是在某一天突然变好的。你是在无数个 9 月 19 日这样的日子里，一边焦虑、一边完成、一边偷偷想着海，慢慢走过来的。`,
    sign:`当时只道是寻常，回头看，每一笔都有来处。`,
    bossTitle:'掌柜的洞见',tipTitle:'掌柜的私语'
  },
  love:{
    zh:'我们的纪念',en:'OUR STORY',title:'我们的故事 · 第 273 页',
    sub:'那扇粉色的门，只对你们两个人打开',footer:'这是我们的第 273 页',footerSub:'故事还在继续',
    top:'那扇粉色的门，只对你们两个人打开。',
    stats:[
      {k:'并肩走过',v:'273 天'},{k:'共同收藏',v:'186 个瞬间'},{k:'一起做过饭',v:'18 顿'},
      {k:'一起看电影',v:'12 场'},{k:'出发旅行',v:'2 次'},{k:'一起看过海',v:'1 次'},{k:'拌嘴又和好',v:'4 次'}
    ],
    coord:'出现最多的坐标：家楼下的那个地铁站',
    story:[
      `3 月 17 日，你写下："今天他迟到了二十分钟，有点生气。" 而他在同一天写："其实我早就到了，绕去街角排队，买了她最近总念叨的热芋泥。"——原来那一天，你以为的不在意，是他没说出口的用心。`,
      `你们的日子，大多是这样的小事：是冰箱上越来越默契的便签，是下雨时不约而同倾向对方的那把伞，是加班到很晚、回家时那盏特意留着的灯。没有那么多惊天动地，却在一天天里，把"我"活成了"我们"。`,
      `连那 4 次拌嘴也算数。因为你们没有把情绪留在深夜，而是在这间小小的当铺里，把委屈说清楚、把台阶递给对方。每一次和好，都让"我们"比从前更结实一点。`,
      `那一次看海，你写："想以后每年都来。" 他在旁边补了一句："好，换不同的海。"`,
      `别人的纪念，是一面会旧的照片墙；而你们的纪念，是一间只属于两个人的当铺——典进的是共同的岁月，从此谁也拿不走。`
    ],
    sign:'这是我们的第 273 页，故事还在继续。'
  },
};
function renderSampleReport(p,s){
  var seedV=TODAY()+'sp'+hash(s.title);
  var big3=s.big3?('<div class="big3">'+s.big3.map(function(b){return '<div><b'+(b.c?' style="color:'+b.c+'"':'')+'>'+b.v+'</b><u>'+b.u+'</u></div>'}).join('')+'</div>'):'';
  var bars=s.bars?('<div style="margin:12px 0">'+s.bars.map(function(x){return '<div class="mood-bar"><span>'+x.k+'</span><div class="track"><div class="fill" style="width:'+x.pct+'%;background:'+x.c+'"></div></div><span>'+x.v+'</span></div>'}).join('')+'</div>'):'';
  var kv=s.kv?('<div class="mblock"><div class="mh"><i class="mno">①</i>'+(s.kvTitle||'')+'</div>'+s.kv.map(function(x){return '<div class="kv"><span>'+x.k+'</span><b>'+x.v+'</b></div>'}).join('')+'</div>'):'';
  var tip=s.tip?('<h4>'+(s.tipTitle||'掌柜的小建议')+'</h4><p class="body" style="color:var(--dim)">'+s.tip.replace(/\n/g,'<br>')+'</p>'):'';
  var sign=s.sign?('<div class="quote">'+s.sign+'</div>'):'';
  var bodyInner;
  if(s.mods){
    var glance=s.glance?('<div style="font-size:12.5px;color:var(--dim);background:rgba(247,241,225,.04);border:1px solid var(--line2);border-radius:10px;padding:10px 12px;margin:4px 0 12px">'+s.glance+'</div>'):'';
    var modsHTML=s.mods.map(function(m){
      var b='';
      if(m.intro)b+='<p class="body" style="color:var(--dim);margin:0 0 10px">'+m.intro+'</p>';
      if(m.cats)b+=m.cats.map(function(c){return '<div style="display:flex;gap:10px;margin:10px 0"><span style="width:10px;height:10px;border-radius:50%;background:'+c.c+';margin-top:6px;flex:0 0 auto"></span><div style="flex:1"><div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap"><b style="font-family:var(--serif);font-size:14px;color:var(--ink)">'+c.k+'</b><span style="color:'+c.c+';font-weight:700">'+c.v+'</span><span style="color:var(--dim2);font-size:11px">'+c.p+'</span></div>'+(c.d?'<div style="font-size:12px;color:var(--dim);margin-top:3px">'+c.d+'</div>':'')+(c.note?'<div style="font-size:12px;color:var(--ink);opacity:.85;margin-top:4px">'+c.note+'</div>':'')+'</div></div>';}).join('');
      if(m.items)b+=m.items.map(function(it){return '<div style="margin:9px 0"><div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap"><b style="color:var(--ink)">'+it.k+'</b>'+(it.v?'<span style="color:var(--gold)">'+it.v+'</span>':'')+'</div>'+(it.d?'<div style="font-size:12px;color:var(--dim);margin-top:3px">'+it.d+'</div>':'');}).join('');
      if(m.board)b+=m.board.map(function(x){return '<div style="margin:9px 0;padding-left:10px;border-left:2px solid var(--gold)"><div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap"><b style="color:var(--ink)">'+x.k+'</b></div>'+(x.d?'<div style="font-size:12px;color:var(--dim);margin-top:3px">'+x.d+'</div>':'');}).join('');
      if(m.concl)b+='<p class="body" style="color:var(--ink);margin-top:10px;opacity:.9">'+m.concl+'</p>';
      return '<div class="mblock"><div class="mh">'+m.h+'</div>'+b+'</div>';
    }).join('');
    var closeS='';
    if(s.sign)closeS+='<div class="quote">'+s.sign+'</div>';
    bodyInner=glance+modsHTML+closeS;
  } else {
    bodyInner=big3+bars+kv+'<h4>'+(s.bossTitle||'掌柜说')+'</h4><p class="body">'+s.boss.split('\n').join('<br>')+'</p>'+tip+sign+'<div class="quote">'+esc(randomQuote(seedV))+'</div>';
  }

  p.innerHTML='<button class="closex" data-close>×</button><div class="ticket">'+
    '<div class="tk-h"><svg class="hw" viewBox="0 0 12 34"><path d="M1 1h10v10H1z"/><path d="M4 4v4h4V4"/><path d="M1 13h10v10H1z"/><path d="M4 16v4h4v-4"/></svg>'+
    '<div class="zh">'+s.zh+'</div><div class="en">'+s.en+'</div><div class="no">No.<b>'+tkNo(seedV)+'</b></div></div>'+
    '<div class="rep">'+
    '<div style="text-align:center;font-family:var(--serif);font-size:19px;letter-spacing:2px;color:var(--gold)">'+s.title+'</div>'+
    '<div style="text-align:center;font-size:10.5px;color:var(--dim2);letter-spacing:1.4px;margin:6px 0 14px">'+s.sub+'</div>'+
    bodyInner+
    '<div class="mini" style="text-align:center;margin-top:14px">（模拟文案 · 示例样板）</div>'+
    '<canvas id="shareCv"></canvas>'+shareCard()+'</div>'+
    '<div class="tk-f"><div class="say">'+(s.footer||'存进来的是光阴，换走的是对自己的看见')+'<i>'+(s.footerSub||'一寸光阴 · 一笔清账')+'</i></div><div class="tk-seal">典进<br>不赎</div></div><div class="perf"></div></div>';
  var cv=drawCard({sub:s.zh,title:s.title,date:s.date||'',rows:(s.big3||[]).map(function(b){return [b.u,b.v]}),quote:randomQuote(seedV)});
  var sh=bindShare(cv,'report.png');
  if($('#shSave'))$('#shSave').onclick=sh.save; if($('#shShare'))$('#shShare').onclick=sh.share;
}
function renderLoveReport(p,s){
  var seedV=TODAY()+'love'+hash(s.title);
  var top=s.top?('<div style="font-size:13px;font-style:italic;line-height:2;color:#F2C1CE;border-left:3px solid #F2A9BC;padding:2px 0 2px 13px;margin-bottom:16px">'+s.top+'</div>'):'';
  var stats=s.stats?('<div style="display:flex;flex-wrap:wrap;gap:0;margin:4px 0 2px">'+
    s.stats.map(function(st,idx){return '<div style="flex:1;min-width:82px;text-align:center;padding:12px 4px'+(idx?'border-left:1px solid rgba(242,169,188,.22)':'')+'">'+
      '<div style="font-family:var(--serif);font-size:27px;font-weight:700;color:#F2A9BC;line-height:1.1;text-shadow:0 0 16px rgba(242,169,188,.25)">'+st.v+'</div>'+
      '<div style="font-size:11px;color:var(--dim2);letter-spacing:1px;margin-top:6px">'+st.k+'</div></div>'}).join('')+'</div>'):'';
  var coord=s.coord?('<div style="font-size:12.5px;opacity:.9;color:#F2C1CE;margin:14px 0;text-align:center;letter-spacing:.5px">'+s.coord+'</div>'):'';
  var story=s.story?('<div style="margin:4px 0">'+
    s.story.map(function(para){return '<p style="font-size:13.5px;line-height:2.1;color:var(--ink);opacity:.92;margin:13px 0;padding-left:14px;border-left:2px solid rgba(242,169,188,.45)">'+para+'</p>'}).join('')+'</div>'):'';
  var sign=s.sign?('<div style="font-family:var(--serif);color:#F2A9BC;font-size:14px;line-height:2;letter-spacing:1.5px;border-left:2px solid #F2A9BC;padding:4px 0 4px 12px;margin:16px 0">'+s.sign+'</div>'):'';
  p.innerHTML='<button class="closex" data-close>×</button><div class="ticket">'+
    '<div class="tk-h"><svg class="hw" viewBox="0 0 12 34"><path d="M1 1h10v10H1z"/><path d="M4 4v4h4V4"/><path d="M1 13h10v10H1z"/><path d="M4 16v4h4v-4"/></svg>'+
    '<div class="zh">'+s.zh+'</div><div class="en">'+s.en+'</div><div class="no">No.<b>'+tkNo(seedV)+'</b></div></div>'+
    '<div class="rep" style="padding:6px 2px">'+
    '<div style="text-align:center;font-family:var(--serif);font-size:22px;letter-spacing:3px;color:#F2A9BC;text-shadow:0 0 20px rgba(242,169,188,.3)">'+s.title+'</div>'+
    '<div style="text-align:center;font-size:10.5px;color:var(--dim2);letter-spacing:1.6px;margin:8px 0 18px">'+s.sub+'</div>'+
    top+stats+coord+story+sign+
    '<div class="mini" style="text-align:center;margin-top:18px;color:rgba(242,169,188,.6)">（模拟文案 · 示例样板）</div>'+
    '<canvas id="shareCv"></canvas>'+shareCard()+'</div>'+
    '<div class="tk-f"><div class="say">'+(s.footer||'')+'<i>'+(s.footerSub||'')+'</i></div><div class="tk-seal">典进<br>不赎</div></div><div class="perf"></div></div>';
  var cv=drawCard({sub:s.zh,title:s.title,date:s.sub,rows:(s.stats||[]).slice(0,3).map(function(st){return [st.k,st.v]}),quote:randomQuote(seedV),accent:'#F2A9BC'});
  var sh=bindShare(cv,'我们的故事.png');
  if($('#shSave'))$('#shSave').onclick=sh.save; if($('#shShare'))$('#shShare').onclick=sh.share;
}

function genDreamReport(){
  var p=panel('<div class="loader"><div class="lp"></div><div class="lt">掌柜正翻看你的梦境…</div></div>');
  var ideas=DB.dream.ideas, flags=DB.dream.flags, letters=DB.dream.letters;
  var sys='你是「光阴的故事」里的梦想守护者，把用户的奇思妙想、Flag 和给未来的信，写成一段温暖有画面感的「梦想年报」。';
  var user='奇思妙想 '+ideas.length+' 条，Flag '+flags.length+' 个，给未来的信 '+letters.length+' 封。';
  var fb=function(){return '你曾在脑海里搭过许多小店、海、和没说出口的吉他课。它们不是空想，是还没熄灭的方向。';};
  AI.call(sys,user,fb,'lyric',{report:true}).then(function(r){
    p.innerHTML='<button class="closex" data-close>×</button><div class="ticket">'+
      '<div class="tk-h"><svg class="hw" viewBox="0 0 12 34"><path d="M1 1h10v10H1z"/><path d="M4 4v4h4V4"/><path d="M1 13h10v10H1z"/><path d="M4 16v4h4v-4"/></svg>'+
      '<div class="zh">白日梦想</div><div class="en">DAYDREAMER</div><div class="no">No.<b>'+tkNo(TODAY()+'dr')+'</b></div></div>'+
      '<div class="rep"><div style="text-align:center;font-family:var(--serif);font-size:19px;letter-spacing:2px;color:var(--gold)">你的梦想年报</div>'+
      '<div style="text-align:center;font-size:10.5px;color:var(--dim2);letter-spacing:1.4px;margin:6px 0 14px">痴想 · Flag · 给未来的信</div>'+
      '<h4>掌柜说</h4><p class="body">'+esc(r.text).replace(/\n/g,'<br>')+'</p>'+
      '<div class="quote">'+esc(randomQuote(TODAY()+'dr'))+'</div>'+
      '<div class="mini" style="text-align:center;margin-top:14px">'+(r.mock?'（模拟文案）':'（DeepSeek 生成）')+'</div>'+
      '<canvas id="shareCv"></canvas>'+shareCard()+'</div>'+
      '<div class="tk-f"><div class="say">把妄想存进当铺<i>总有一日 · 会发光的</i></div><div class="tk-seal">典进<br>不赎</div></div><div class="perf"></div></div>';
    var cv=drawCard({sub:'白日梦想',title:'我的梦想年报',date:'',rows:[['奇思',ideas.length+'条'],['Flag',flags.length+'个']],quote:randomQuote(TODAY()+'dr')});
    var sh=bindShare(cv,'梦想年报.png');
    if($('#shSave'))$('#shSave').onclick=sh.save; if($('#shShare'))$('#shShare').onclick=sh.share;
  });
}


/* 报告结尾 slogan：古诗词/歌词/网络用语/心灵鸡汤 随机 */
function randomQuote(seedv){
  var s=seedv||String(Math.random());
  var all=[MOCK.poemLine({seed:s+'p'}),MOCK.lyric({seed:s+'l'}),MOCK.net({seed:s+'n'}),MOCK.soup({seed:s+'s'})];
  return all[hash(s+'q')%all.length];
}

/* ============================================================
   语义解析（轻量规则，模拟 AI 提取）
   ============================================================ */
function cn2n(s){
  var d={'零':0,'一':1,'壹':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};
  var u={'十':10,'百':100,'千':1000,'万':10000};
  var total=0,cur=0,has=false;
  for(var i=0;i<s.length;i++){
    var c=s.charAt(i);
    if(c in d){cur=d[c];has=true}
    else if(c in u){total+=(cur||1)*u[c];cur=0;has=true}
  }
  return has?total+cur:null;
}
function cnNorm(s){
  return String(s).replace(/半\s*个?\s*(小时|钟头)/g,'30分钟').replace(/半\s*小时/g,'30分钟')
    .replace(/[零一壹二两三三四五六七八九十百千万]+/g,function(m){
      var n=cn2n(m);return n==null?m:String(n)});
}
function parseTasks(s){
  return String(cnNorm(s)).split(/[，,。;；、\n\r]+|然后|接着|之后|还有|再|and/).map(function(x){return x.trim()}).filter(function(x){return x.length>0})
   .map(function(seg){
     var at=parseClock(seg);
     var m=seg.match(/(\d+(?:\.\d+)?)\s*(个小时|小时|钟头|h|分钟|分)/i);
     var min=null,txt=seg;
     if(m){min=/小|h/i.test(m[2])?parseFloat(m[1])*60:parseFloat(m[1]);txt=seg.replace(m[0],' ').trim()}
     return {t:txt||seg,min:min||30,cat:guessTimeCat(txt||seg),at:at};
   });
}
function parseClock(seg){
  seg=String(seg||'');
  var per=seg.match(/(凌晨|早上|早晨|上午|中午|下午|傍晚|晚上|夜里)/);
  var m=seg.match(/(\d{1,2})[:：](\d{2})/);
  var h,mi=0;
  if(m){h=parseInt(m[1],10);mi=parseInt(m[2],10);}
  else{var m2=seg.match(/(\d{1,2})\s*点\s*(半)?/);if(!m2)return null;h=parseInt(m2[1],10);if(m2[2])mi=30;}
  if(per){var p=per[1];
    if(p==='中午')h=12;
    else if(p==='下午'||p==='傍晚'||p==='晚上'||p==='夜里'){if(h<12)h+=12;}
    else if(p==='凌晨'){if(h>=12)h-=12;}}
  var mins=h*60+mi;if(mins<0)mins=0;if(mins>1439)mins=1439;return mins;
}

function parseAmount(s){
  var s2=cnNorm(s);
  var m=s2.match(/(\d+(?:\.\d+)?)\s*(?:块钱|块|元|rmb|RMB|¥)/i);
  if(m)return parseFloat(m[1]);
  var all=s2.match(/\d+(?:\.\d+)?/g);
  if(!all)return null;
  if(all.length===1)return parseFloat(all[0]);
  return parseFloat(all.sort(function(a,b){return parseFloat(b)-parseFloat(a)})[0]);
}
var CAT_KW={food:'吃饭 午饭 晚饭 早餐 外卖 餐厅 小龙虾 食堂 便当 水果 面包 面条 拉面 盖饭 饺子 包子 喝粥 火锅外卖',
  drink:'咖啡 奶茶 可乐 果汁 饮料 酸奶 牛奶 啤酒 红酒 美式 拿铁 果茶 柠檬茶 气泡水',
  junk:'火锅 烧烤 炸鸡 汉堡 披萨 甜品 蛋糕 薯片 零食 宵夜 夜宵 冰淇淋 炸串 麻辣烫',
  move:'地铁 公交 打车 滴滴 高铁 火车 机票 加油 停车 单车 共享单车 出租车 车票 通勤',
  buy:'衣服 鞋 包 裤子 化妆品 数码 手机 电脑 耳机 买 淘宝 京东 拼多多 快递 网购 帽子 首饰 口红 T恤 t恤 卫衣',
  home:'房租 水电 物业 燃气 宽带 超市 日用品 纸巾 洗衣 家具 米 油 清洁 收纳',
  fun:'电影 游戏 演出 门票 KTV 旅行 旅游 酒店 剧本杀 演唱会 展 会员 充值 按摩',
  heal:'药 医院 看病 体检 健身 药店 牙 挂号 保险 维生素 医美',
  learn:'书 课程 网课 培训 考试 学费 文具 报名 知识付费 学习 证书 教材 打印 资料',
  social:'aa AA 朋友 聚餐 聚会 请客 桌游 应酬',
  love:'鲜花 玫瑰 礼物 情侣 约会 纪念日 巧克力 对戒 惊喜',
  peo:'红包 份子 生日 婚礼 随礼 送 年货 长辈'};
function classify(s){
  var t=String(s),best='etc',bs=0;
  for(var k in CAT_KW){var ws=CAT_KW[k].split(' '),sc=0;
    for(var i=0;i<ws.length;i++){if(ws[i]&&t.indexOf(ws[i])>=0)sc+=ws[i].length}
    if(sc>bs){bs=sc;best=k}}
  return best;
}
function sim(a,b){
  a=String(a).replace(/[的了呢啊吧呀哦，,.。!！?？\s]/g,'');b=String(b).replace(/[的了呢啊吧呀哦，,.。!！?？\s]/g,'');
  if(!a||!b)return 0;
  if(a.indexOf(b)>=0||b.indexOf(a)>=0)return .9;
  var A={},n=0;
  for(var i=0;i<a.length-1;i++){A[a.substr(i,2)]=1;n++}
  var m=0;for(var j=0;j<b.length-1;j++){if(A[b.substr(j,2)])m++}
  return n?m/Math.max(n,b.length-1):0;
}

/* ============================================================
   统计（含与上期对比）
   ============================================================ */
function statsRange(from,to){
  var es=DB.time.filter(function(e){return (!from||e.date>=from)&&(!to||e.date<=to)});
  var planN=0,actN=0,done=0,planMin=0,actMin=0,extraMin=0,extraN=0,miss=[],catH={};
  es.forEach(function(e){
    (e.plan||[]).forEach(function(p){planN++;planMin+=(parseFloat(p.min)||0)});
    (e.actual||[]).forEach(function(a){
      actN++;var mm=parseFloat(a.min)||0;actMin+=mm;
      var c=a.cat||guessTimeCat(a.t);catH[c]=(catH[c]||0)+mm;
      var hit=false;
      (e.plan||[]).forEach(function(p){if(sim(p.t,a.t)>=.34)hit=true});
      if(!hit){extraN++;extraMin+=mm}
    });
    (e.plan||[]).forEach(function(p){
      var ok=false;(e.actual||[]).forEach(function(a){if(sim(p.t,a.t)>=.34)ok=true});
      if(ok)done++;else miss.push(p.t);
    });
  });
  var rate=planN?done/planN:0;
  var mc={};miss.forEach(function(t){mc[t]=(mc[t]||0)+1});
  var top='';Object.keys(mc).forEach(function(k){if(mc[k]>(mc[top]||0))top=k});
  var cats=Object.keys(catH).map(function(k){var c=timeCatOf(k);return {k:k,n:c.n,c:c.c,h:catH[k]/60}}).sort(function(a,b){return b.h-a.h});
  return {from:from,to:to,days:es.length,planN:planN,actN:actN,done:done,missN:planN-done,
    rate:rate,pct:Math.round(rate*100),planH:+(planMin/60).toFixed(1),actH:+(actMin/60).toFixed(1),
    extraN:extraN,extraPct:actMin?Math.round(extraMin/actMin*100):0,top:top,cats:cats};
}
function timeStats(kind){
  var from=rangeStart(kind);
  var cur=statsRange(from,TODAY());
  var pr=prevRange(kind);
  var prev=statsRange(pr.from,pr.to);
  cur.prev=prev;
  cur.hasPrev=prev.days>0;
  cur.kind=kind;cur.unit=RANGE_UNIT[kind];cur.from=from;
  return cur;
}
function moneyStats(){
  var ws=weekStart(TODAY());
  var prevStart=iso(new Date(new Date(ws+'T00:00:00').getTime()-7*86400000));
  var cur=DB.money.filter(function(m){return m.date>=ws});
  var prev=DB.money.filter(function(m){return m.date>=prevStart&&m.date<ws});
  var sum=function(a){return a.reduce(function(s,x){return s+x.amt},0)};
  var by={},byP={};
  cur.forEach(function(m){by[m.cat]=(by[m.cat]||0)+m.amt});
  prev.forEach(function(m){byP[m.cat]=(byP[m.cat]||0)+m.amt});
  var arr=Object.keys(by).map(function(k){var c=catOf(k);return {k:k,n:c.n,c:c.c,v:by[k],pv:byP[k]||0}}).sort(function(a,b){return b.v-a.v});
  var maxE=cur.slice().sort(function(a,b){return b.amt-a.amt})[0];
  var ct=sum(cur),pt=sum(prev);
  return {cur:ct,prev:pt,diff:ct-pt,arr:arr,total:ct||1,
    top1:arr[0]?arr[0].n:'—',top1pct:arr[0]?Math.round(arr[0].v/(ct||1)*100):0,
    top2:arr[1]?arr[1].n:'',max:maxE?maxE.amt:0,maxNote:maxE?maxE.note:'',ws:ws,
    hasPrev:prev.length>0};
}

function moneyMonthStats(){
  var now=new Date();
  var curStart=new Date(now.getFullYear(),now.getMonth(),1);
  var prevStart=new Date(now.getFullYear(),now.getMonth()-1,1);
  var curS=iso(curStart), prevS=iso(prevStart);
  var cur=DB.money.filter(function(m){return m.date>=curS});
  var prev=DB.money.filter(function(m){return m.date>=prevS&&m.date<curS});
  var sum=function(a){return a.reduce(function(s,x){return s+x.amt},0)};
  var by={},byP={};
  cur.forEach(function(m){by[m.cat]=(by[m.cat]||0)+m.amt});
  prev.forEach(function(m){byP[m.cat]=(byP[m.cat]||0)+m.amt});
  var arr=Object.keys(by).map(function(k){var c=catOf(k);return {k:k,n:c.n,c:c.c,v:by[k],pv:byP[k]||0}}).sort(function(a,b){return b.v-a.v});
  var ct=sum(cur), pt=sum(prev);
  return {cur:ct,prev:pt,diff:ct-pt,arr:arr,total:ct||1,hasPrev:prev.length>0};
}
function moodDays(n){
  var r=[];for(var i=n-1;i>=0;i--){var d=dayAgo(i);
    var e=DB.mood.filter(function(m){return m.date===d});
    r.push({date:d,e:e});}
  return r;
}

/* ---------- 轨迹图（SVG，小红书年报式） ---------- */
function trajSVG(days,opt){
  /* opt: {series:[{name,color,values:[{x,label,v}]}], max, unit, pctMode} */
  var W=560,H=170,padL=8,padR=8,padT=16,padB=26;
  var iw=W-padL-padR, ih=H-padT-padB;
  var n=days.length;
  var mx=opt.max||1;
  var svg='<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg">';
  svg+='<defs><linearGradient id="tg'+opt.gid+'" x1="0" y1="0" x2="0" y2="1">'+
    '<stop offset="0" stop-color="'+opt.series[0].color+'" stop-opacity=".34"/>'+
    '<stop offset="1" stop-color="'+opt.series[0].color+'" stop-opacity="0"/></linearGradient></defs>';
  /* 横网格 */
  for(var g=1;g<=3;g++){var gy=padT+ih-ih*g/3;
    svg+='<line x1="'+padL+'" y1="'+gy+'" x2="'+(W-padR)+'" y2="'+gy+'" stroke="rgba(247,241,225,.08)" stroke-width="1"/>'}
  var pts=[],pts2=[];
  for(var i=0;i<n;i++){
    var x=padL+(n===1?iw/2:i*iw/(n-1));
    pts.push([x,padT+ih-(Math.min(days[i].v,mx)/mx)*ih]);
    if(opt.series[1])pts2.push([x,padT+ih-(Math.min(days[i].v2||0,mx)/mx)*ih]);
  }
  if(opt.fill!==false){
    var d0='M'+pts[0][0]+','+(padT+ih);
    pts.forEach(function(p){d0+=' L'+p[0].toFixed(1)+','+p[1].toFixed(1)});
    d0+=' L'+pts[pts.length-1][0]+','+(padT+ih)+' Z';
    svg+='<path d="'+d0+'" fill="url(#tg'+opt.gid+')"/>';
  }
  var pl='';pts.forEach(function(p,i){pl+=(i?' L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)});
  svg+='<path d="'+pl+'" fill="none" stroke="'+opt.series[0].color+'" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>';
  if(opt.series[1]){
    var pl2='';pts2.forEach(function(p,i){pl2+=(i?' L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)});
    svg+='<path d="'+pl2+'" fill="none" stroke="'+opt.series[1].color+'" stroke-width="1.6" stroke-dasharray="4 4" stroke-linecap="round" opacity=".85"/>';
  }
  pts.forEach(function(p,i){
    var last=i===pts.length-1;
    svg+='<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="'+(last?4:2.4)+'" fill="'+(last?'#FFF':'#1B2044')+'" stroke="'+opt.series[0].color+'" stroke-width="1.6"/>';
    if(last)svg+='<text x="'+p[0]+'" y="'+(p[1]-11)+'" text-anchor="middle" font-size="12" fill="#F0D394" font-family="serif">'+(Math.round(days[i].v*10)/10)+(opt.pctMode?'%':'')+'</text>';
  });
  var step=Math.ceil(n/6);
  for(var j=0;j<n;j+=step){
    var lx=padL+(n===1?iw/2:j*iw/(n-1));
    svg+='<text x="'+lx+'" y="'+(H-6)+'" text-anchor="middle" font-size="10" fill="rgba(247,241,225,.4)">'+days[j].label+'</text>';
  }
  svg+='</svg>';
  return svg;
}
/* 近 N 天时间轨迹：每天 实际小时（主线）+ 计划小时（虚线） */
function timeTraj(n,kind){
  var out=[],mx=1;
  for(var i=n-1;i>=0;i--){
    var d=dayAgo(i),p=0,a=0;
    var e=DB.time.filter(function(x){return x.date===d})[0];
    if(e){(e.plan||[]).forEach(function(x){p+=(parseFloat(x.min)||0)});(e.actual||[]).forEach(function(x){a+=(parseFloat(x.min)||0)})}
    p/=60;a/=60;mx=Math.max(mx,p,a);
    out.push({label:d.slice(5).replace('-','/'),v:+a.toFixed(1),v2:+p.toFixed(1)});
  }
  return {days:out,mx:Math.ceil(mx*1.15*10)/10};
}
/* 近 N 天支出轨迹 */
function moneyTraj(n){
  var out=[],mx=1;
  for(var i=n-1;i>=0;i--){
    var d=dayAgo(i);
    var s=DB.money.filter(function(x){return x.date===d}).reduce(function(a,x){return a+x.amt},0);
    mx=Math.max(mx,s);
    out.push({label:d.slice(5).replace('-','/'),v:Math.round(s)});
  }
  return {days:out,mx:Math.ceil(mx*1.15)};
}

/* ============================================================
   UI 基础
   ============================================================ */
var tmr;
function toast(s){var t=$('#toast');t.textContent=s;t.classList.add('on');clearTimeout(tmr);tmr=setTimeout(function(){t.classList.remove('on')},2100)}
function openModal(id){$('#'+id).classList.add('open')}
function closeModal(id){$('#'+id).classList.remove('open')}
document.addEventListener('click',function(e){
  var c=e.target.closest('[data-close]');if(c){var m=c.closest('.modal');if(m)m.classList.remove('open')}
});
function ask(title,desc,ok,danger){
  return new Promise(function(res){
    $('#mAskPanel').innerHTML='<div class="ph">'+esc(title)+'</div><div class="pd">'+desc+'</div>'+
      '<div class="row"><button class="btn" id="askNo">再想想</button><button class="btn '+(danger?'danger':'pri')+'" id="askYes">'+esc(ok)+'</button></div>';
    openModal('mAsk');
    $('#askNo').onclick=function(){closeModal('mAsk');res(false)};
    $('#askYes').onclick=function(){closeModal('mAsk');res(true)};
  });
}
function panel(html,center){var m=$('#mMod');m.classList.toggle('center',!!center);var p=$('#mModPanel');p.innerHTML='<button class="closex" data-close>×</button>'+html;openModal('mMod');return p}
function chime(){
  var c=$('#chime');c.classList.remove('on');void c.offsetWidth;c.classList.add('on');
  setTimeout(function(){c.classList.remove('on')},1500);
  if(DB.ai.sound){try{
    var C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    window.__ac=window.__ac||new C();var ac=window.__ac;
    [880,1174.7].forEach(function(f,i){
      var o=ac.createOscillator(),g=ac.createGain();
      o.type='sine';o.frequency.value=f;g.gain.value=0;
      o.connect(g);g.connect(ac.destination);
      var t0=ac.currentTime+i*0.13;
      g.gain.linearRampToValueAtTime(0.035,t0+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001,t0+1.1);
      o.start(t0);o.stop(t0+1.2);
    });
  }catch(e){}}
}

function flipChime(){
  if(!DB.ai.sound)return;
  try{
    var C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    window.__ac=window.__ac||new C();var ac=window.__ac;
    [1568,2093].forEach(function(f,i){
      var o=ac.createOscillator(),g=ac.createGain();
      o.type='sine';o.frequency.value=f;g.gain.value=0;
      o.connect(g);g.connect(ac.destination);
      var t0=ac.currentTime+i*0.07;
      g.gain.linearRampToValueAtTime(0.022,t0+0.012);
      g.gain.exponentialRampToValueAtTime(0.0001,t0+0.55);
      o.start(t0);o.stop(t0+0.6);
    });
  }catch(e){}
}

/* ---------- 语音 ---------- */
var VOICE_SAMPLES={
  plan:['今天打算写周报40分钟，看30页书，再跑半小时步','上午写方案两小时，下午开会，晚上看一小时书','打算背单词半小时，健身一小时，早点睡'],
  actual:['写了周报但是花了快一个小时，然后刷了会儿手机，跟朋友吃了个饭，书只看了几页','方案写到一半被拉去开会，晚上加班，书没看','背了单词，健身去了，但是又追剧到十二点'],
  money:['中午点了个外卖二十八块','打车花了二十六','超市买了一堆日用品八十六块','和朋友吃火锅一百八十六','今天喝奶茶二十块'],
  mood:['今天下班路上看到特别好看的晚霞，站那儿看了五分钟','说不上来为什么，今天有点低落','今天什么都没发生，但我觉得挺好的'],
  dream:['想成为一个说话很慢但每句都有分量的人','梦见自己在一间挂满钟表的大厅里，指针都在倒着走','如果记忆能像文件一样拖拽，语言还有存在的必要吗'],
  mem:['今天一起去了那家很小的面馆，他把最后一颗卤蛋夹给我','吵了一架，但是回去的路上他还是牵了我的手']
};
function startVoice(kind,cb){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  var done=false;
  var finish=function(t){if(done)return;done=true;closeModal('mMod');cb(t)};
  /* 优先走 React 侧统一语音入口（腾讯云实时识别），失败再回落到原生逻辑 */
  if(OPTS.voice&&DB.ai.voice!=='mock'){
    showRec();
    OPTS.voice(kind).then(function(t){finish(t||'')},function(){finish('')});
    return;
  }
  if(SR&&DB.ai.voice!=='mock'){
    try{
      var r=new SR();r.lang='zh-CN';r.interimResults=false;r.maxAlternatives=1;
      r.onresult=function(e){finish(e.results[0][0].transcript)};
      r.onerror=function(){finish(mockText(kind))};
      r.onend=function(){if(!done)finish(mockText(kind))};
      showRec();r.start();return;
    }catch(e){}
  }
  showRec();
  setTimeout(function(){finish(mockText(kind))},1500);
}
function mockText(kind){var a=VOICE_SAMPLES[kind]||VOICE_SAMPLES.mood;return a[Math.floor(Math.random()*a.length)]}
function showRec(){
  var ws='';for(var i=0;i<13;i++)ws+='<i style="animation-delay:'+(i*0.07)+'s"></i>';
  panel('<div class="rec"><div class="mic"><svg viewBox="0 0 24 24"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/></svg></div>'+
    '<div class="wave">'+ws+'</div><div class="mini" style="margin-top:10px;letter-spacing:1.6px">正在聆听…</div>'+
    '<div class="mini" style="margin-top:6px">（腾讯云实时识别 · 说完停一下会自动结束）</div></div>');
}
function pickPhoto(cb){
  var i=document.createElement('input');i.type='file';i.accept='image/*';
  i.onchange=function(){
    var f=i.files[0];if(!f)return;
    var fr=new FileReader();
    fr.onload=function(){
      var im=new Image();
      im.onload=function(){
        var w=Math.min(680,im.width),h=im.height*w/im.width;
        var c=document.createElement('canvas');c.width=w;c.height=h;
        c.getContext('2d').drawImage(im,0,0,w,h);
        cb(c.toDataURL('image/jpeg',0.66));
      };
      im.src=fr.result;
    };
    fr.readAsDataURL(f);
  };
  i.click();
}

/* ---------- 分享（保存图片 / 系统分享到朋友圈） ---------- */
function shareCard(cv,name){
  var btns='<div class="row" style="margin-top:10px">'+
    '<button class="btn" id="shSave" style="flex:1">保存图片</button>'+
    '<button class="btn pri" id="shShare" style="flex:1">分享到朋友圈</button></div>'+
    '<div class="mini" style="margin-top:8px;text-align:center">保存后打开微信 → 朋友圈 → 从相册选择，就能发出去了</div>';
  return btns;
}
function bindShare(cv,dlName){
  var doSave=function(){
    try{var a=document.createElement('a');a.download=dlName;a.href=cv.toDataURL('image/png');a.click();toast('图片已保存，去相册看看')}
    catch(e){toast('保存失败，可长按图片保存')}
  };
  var doShare=function(){
    if(navigator.share&&navigator.canShare){
      cv.toBlob(function(blob){
        var f=new File([blob],'光阴的故事.png',{type:'image/png'});
        if(navigator.canShare({files:[f]})){
          navigator.share({files:[f],title:'光阴的故事'}).catch(function(){});
        }else doSave();
      },'image/png');
    }else{doSave();toast('当前浏览器不支持直接分享，已帮你保存图片')}
  };
  return {save:doSave,share:doShare};
}

/* ---------- 星河分享卡 ---------- */
function rr(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
function wrap(x,text,cx,y,maxW,lh){
  var line='',res=[];
  for(var i=0;i<text.length;i++){var t=line+text[i];
    if(x.measureText(t).width>maxW&&line){res.push(line);line=text[i]}else line=t}
  if(line)res.push(line);
  res.slice(0,4).forEach(function(l,i){x.fillText(l,cx,y+i*lh)});
}
function drawCard(o){
  var cv=$('#shareCv')||document.createElement('canvas');
  var W=640;
  var PF='"Kaiti SC","STKaiti","KaiTi","Songti SC",serif';
  var SF='"PingFang SC","Microsoft YaHei",sans-serif';
  function fitLines(x,text,maxW){
    var line='',res=[];
    for(var i=0;i<text.length;i++){var t=line+text[i];
      if(x.measureText(t).width>maxW&&line){res.push(line);line=text[i]}else line=t}
    if(line)res.push(line);
    return res.slice(0,4);
  }
  function wrap(x,text,cx,y,maxW,lh){
    fitLines(x,text,maxW).forEach(function(l,i){x.fillText(l,cx,y+i*lh)});
  }
  // measure phase
  var tmp=document.createElement('canvas');tmp.width=W;tmp.height=10;
  var t=tmp.getContext('2d');
  var rows=o.rows||[];
  var accent=o.accent||'#F0D394';
  var hasTraj=!!o.traj;
  var kws=o.keys||[];
  t.font='16px '+PF;
  var kwWs=kws.map(function(k){return t.measureText(k).width+34});
  var kwTot=0;kwWs.forEach(function(w){kwTot+=w});kwTot+=(kws.length-1)*12;
  t.font='17px '+PF;
  var quoteLines=o.quote?fitLines(t,o.quote,W-160):[];
  // compute height
  var topY=50, titleY=topY+96, rowsY=titleY+56;
  var y=rowsY;
  if(rows.length) y+=92+20; else y+=30;
  if(hasTraj) y+=150+30;
  if(o.quote) y+=quoteLines.length*30+30;
  if(kws.length) y+=36+30;
  var H=Math.min(1040, Math.max(560, y+200));
  // draw
  cv.width=W;cv.height=H;
  var x=cv.getContext('2d');
  var g=x.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#161B3C');g.addColorStop(.55,'#232852');g.addColorStop(1,'#2E2A5C');
  x.fillStyle=g;x.fillRect(0,0,W,H);
  // stars
  function sRad(cx,cy,r,cc){var rg=x.createRadialGradient(cx,cy,0,cx,cy,r);rg.addColorStop(0,cc);rg.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=rg;x.fillRect(cx-r,cy-r,r*2,r*2)}
  sRad(W*.82,topY-30,150,'rgba(240,200,130,.16)');
  sRad(W*.14,topY+20,130,'rgba(242,169,188,.10)');
  sRad(W*.5,H*.75,180,'rgba(155,168,240,.10)');
  for(var i=0;i<170;i++){
    var sx=Math.random()*W,sy=Math.random()*H,sr=Math.random()*1.6+.4;
    x.fillStyle='rgba(255,244,214,'+(Math.random()*.8+.1).toFixed(2)+')';
    x.beginPath();x.arc(sx,sy,sr,0,6.2832);x.fill();
  }
  // borders
  x.strokeStyle='rgba(240,211,148,.55)';x.lineWidth=1.6;x.strokeRect(28,28,W-56,H-56);
  x.strokeStyle='rgba(240,211,148,.2)';x.lineWidth=1;x.strokeRect(37,37,W-74,H-74);
  x.textAlign='center';x.textBaseline='alphabetic';
  x.fillStyle='#E4BC72';x.font='17px '+PF;
  x.fillText('光 阴 的 故 事',W/2,topY+28);
  x.fillStyle='rgba(247,241,225,.5)';x.font='11px '+SF;
  x.fillText('第 ∞ 号 当 铺 · '+(o.sub||'你的人生时光机'),W/2,topY+50);
  x.strokeStyle='rgba(240,211,148,.3)';x.lineWidth=1;
  x.beginPath();x.moveTo(120,topY+64);x.lineTo(W-120,topY+64);x.stroke();
  x.fillStyle='#F7F1E1';x.font='600 40px '+PF;
  x.fillText(o.title,W/2,titleY);
  x.fillStyle='rgba(247,241,225,.55)';x.font='12px '+SF;
  x.fillText(o.date,W/2,titleY+26);
  y=rowsY;
  if(rows.length){
    var n=rows.length,cw=(W-140-((n-1)*14))/n;
    rows.forEach(function(r,i){
      var bx=70+i*(cw+14),by=y;
      x.strokeStyle='rgba(240,211,148,.35)';x.lineWidth=1.2;rr(x,bx,by,cw,92,14);x.stroke();
      x.fillStyle='rgba(240,211,148,.07)';x.fill();
      x.fillStyle=accent;x.font='600 30px '+PF;x.textAlign='center';
      x.fillText(r[1],bx+cw/2,by+48);
      x.fillStyle='rgba(247,241,225,.5)';x.font='11px '+SF;
      x.fillText(r[0],bx+cw/2,by+74);
    });
    y+=92+20;
  }else{ y+=30; }
  if(hasTraj){
    x.fillStyle='rgba(247,241,225,.45)';x.font='11px '+SF;x.textAlign='left';
    x.fillText(o.trajTitle||'轨迹',70,y);
    drawTrajCanvas(x,70,y+14,W-140,150,o.traj,o.trajColor||'#F0D394',o.trajColor2||'rgba(155,168,240,.8)',o.trajMax||1,o.trajPct);
    y+=150+30;
  }
  if(o.quote){
    x.textAlign='center';x.fillStyle='#E4BC72';x.font='17px '+PF;
    wrap(x,o.quote,W/2,y+24,W-160,30);
    y+=quoteLines.length*30+30;
  }
  if(kws.length){
    var cx=(W-kwTot)/2, kwY=y;
    kws.forEach(function(k,i){
      x.strokeStyle='rgba(242,169,188,.5)';x.lineWidth=1.2;rr(x,cx,kwY,kwWs[i],36,18);x.stroke();
      x.fillStyle='rgba(242,169,188,.08)';x.fill();
      x.fillStyle='#F2A9BC';x.fillText(k,cx+kwWs[i]/2,kwY+24);
      cx+=kwWs[i]+12;
    });
    y+=36+30;
  }
  // seal
  x.save();x.translate(W-96,H-116);x.rotate(-0.14);
  x.fillStyle='rgba(216,116,110,.9)';
  x.beginPath();x.arc(0,0,33,0,6.2832);x.fill();
  x.fillStyle='#FFF3EA';x.font='600 19px '+PF;
  x.textAlign='center';x.textBaseline='middle';x.fillText('光阴',0,1);
  x.restore();x.textAlign='center';x.textBaseline='alphabetic';
  x.fillStyle='rgba(247,241,225,.6)';x.font='12px '+SF;
  x.fillText('存进来的是光阴 · 换走的是对自己的看见',W/2,H-76);
  x.fillStyle='rgba(247,241,225,.35)';x.font='10px '+SF;
  x.fillText('第∞号当铺 · 今夜营业 · 数据只存在这台设备',W/2,H-54);
  return cv;
}
/* canvas 版轨迹（分享卡用） */
function drawTrajCanvas(x,X,Y,W,Hh,days,c1,c2,mx,pctMode){
  var n=days.length,pad=14;
  var iw=W-pad*2,ih=Hh-pad*2;
  x.strokeStyle='rgba(247,241,225,.1)';x.lineWidth=1;
  for(var g=1;g<=2;g++){var gy=Y+Hh-pad-ih*g/2;
    x.beginPath();x.moveTo(X+pad,gy);x.lineTo(X+W-pad,gy);x.stroke()}
  var pts=[];
  for(var i=0;i<n;i++){
    var px=X+pad+(n===1?iw/2:i*iw/(n-1));
    var py=Y+Hh-pad-(Math.min(days[i].v,mx)/mx)*ih;
    pts.push([px,py]);
  }
  x.beginPath();
  pts.forEach(function(p,i){if(i)x.lineTo(p[0],p[1]);else x.moveTo(p[0],p[1])});
  x.strokeStyle=c1;x.lineWidth=2.6;x.lineCap='round';x.lineJoin='round';x.stroke();
  pts.forEach(function(p,i){
    x.beginPath();x.arc(p[0],p[1],i===pts.length-1?4:2.2,0,6.2832);
    x.fillStyle=i===pts.length-1?'#FFF':'#1B2044';x.fill();
    x.strokeStyle=c1;x.lineWidth=1.6;x.stroke();
  });
  if(c2){
    x.beginPath();
    for(var j=0;j<n;j++){
      var px2=X+pad+(n===1?iw/2:j*iw/(n-1));
      var py2=Y+Hh-pad-(Math.min(days[j].v2||0,mx)/mx)*ih;
      if(j)x.lineTo(px2,py2);else x.moveTo(px2,py2);
    }
    x.strokeStyle=c2;x.lineWidth=1.6;x.setLineDash([5,5]);x.stroke();x.setLineDash([]);
  }
  var step=Math.ceil(n/5);
  x.fillStyle='rgba(247,241,225,.4)';x.font='10px sans-serif';x.textAlign='center';
  for(var k2=0;k2<n;k2+=step){
    var lx=X+pad+(n===1?iw/2:k2*iw/(n-1));
    x.fillText(days[k2].label,lx,Y+Hh-1);
  }
}

/* ============================================================
   导航
   ============================================================ */
var deckIdx=0,W=function(){var p=$('#pHome');if(p){var w=p.getBoundingClientRect().width;if(w>10)return w}return window.innerWidth/2||390};
var activeSheet=null;
var NAV={go:(OPTS&&OPTS.onGo)||null,back:(OPTS&&OPTS.onBack)||null};
function setDeck(i,silent){
  deckIdx=i;
  $('#deck').style.transform='translate3d('+(-i*W())+'px,0,0)';
  if(!silent)chime();
  if(i===1){DB.__ui=DB.__ui||{};DB.__ui.showMemGate=true;renderMem();}
}
function openSheet(id){
  activeSheet=id;$('#'+id).classList.add('open');$('#topbar').classList.add('hide');chime();
  if(id==='sTime')renderTime();if(id==='sMoney')renderMoney();
  if(id==='sMood')renderMood();if(id==='sDream')renderDream();
}
function closeSheet(){
  if(!activeSheet)return;
  $('#'+activeSheet).classList.remove('open');activeSheet=null;$('#topbar').classList.remove('hide');chime();
  renderHome();
}
$$('[data-back]').forEach(function(b){b.onclick=function(){if(NAV.back){NAV.back();return}closeSheet()}});
$$('.card').forEach(function(c){c.onclick=function(){if(NAV.go){NAV.go(c.dataset.go);return}openSheet('s'+c.dataset.go.charAt(0).toUpperCase()+c.dataset.go.slice(1))}});
var __btnBox=$('#btnBox');if(__btnBox)__btnBox.onclick=openBox;
var __btnBoxHome=$('#btnBoxHome');if(__btnBoxHome)__btnBoxHome.onclick=openBox;
var __memEntry=$('#memEntry');if(__memEntry)__memEntry.onclick=function(){setDeck(1);};

/* 手势（仅保留模块页下拉关闭；纪念册用按钮进出） */
(function(){
  var hy=null;
  $$('.sheet-head').forEach(function(h){
    h.addEventListener('touchstart',function(e){hy=e.touches[0].clientY},{passive:true});
    h.addEventListener('touchmove',function(e){
      if(hy==null)return;var d=e.touches[0].clientY-hy;
      if(d>0){var s=h.closest('.sheet');s.style.transition='none';s.style.transform='translateY('+d+'px)'}
    },{passive:true});
    h.addEventListener('touchend',function(e){
      if(hy==null)return;var d=e.changedTouches[0].clientY-hy;hy=null;
      var s=h.closest('.sheet');s.style.transition='';s.style.transform='';
      if(d>80){if(NAV.back){NAV.back()}else{closeSheet()}}
    });
  });
})();

/* ============================================================
   开场引导：开门 + 开业指引
   ============================================================ */
var COACH=[
  {t:'第∞号当铺 · 今夜开张',b:'老板娘失踪之后，当铺由掌柜（我）替你看守。\n\n这里典当的不是物件，是时间、金钱、心情和梦想。\n\n只需 30 秒，由我带你一起解锁。'},
  {t:'① 时间都去哪儿了',b:'把「想做的事」与「真做的事」各记一笔，\n光阴的对账单，自会教你日子怎生溜走。'},
  {t:'② 我的钱都去哪儿了',b:'一句话记一笔流水：「今儿奶茶二十块」，\n掌柜替你算清数目、分清门类，还与上周比个高下。'},
  {t:'③ 心情树洞',b:'在这里分享你的喜怒哀乐，\n甚至可以自己定义心情标签，\n树会长出你的心情树洞。'},
  {t:'④ 白日梦想家',b:'记录你的奇思妙想、未来想成为什么样的人、\n立 flag，或者写封信给未来的自己。'},
  {t:'⑤ 月光宝盒',b:'想念某一天了？点这里穿越回去，\n看看那时的自己。'},
  {t:'⑥ 我们的纪念',b:'推开粉色的门 ——\n属于两个人的纪念册，在这里储存你们的幸福轨迹。'},
  {t:'⑦ 最后一句',b:'从今天起，做自己人生的掌柜。'}
];
function maybeCoach(){
  if(DB.guide===false)return;
  setTimeout(startCoach,450);
}
function startCoach(){
  var idx=0;
  var c=$('#coach');
  c.classList.remove('hidden');
  function draw(){
    $('#coachTitle').textContent=COACH[idx].t;
    $('#coachBody').textContent=COACH[idx].b;
    $('#coachBody').style.whiteSpace='pre-wrap';
    var d='';COACH.forEach(function(_,i){d+='<i class="'+(i===idx?'on':'')+'"></i>'});
    $('#coachDots').innerHTML=d;
    $('#coachPrev').style.visibility=idx===0?'hidden':'visible';
    $('#coachNext').textContent=idx===COACH.length-1?'开张营业':'下一步';
  }
  $('#coachPrev').onclick=function(){if(idx>0){idx--;draw()}};
  $('#coachNext').onclick=function(){
    if(idx<COACH.length-1){idx++;draw()}
    else endCoach();
  };
  $('#coachSkip').onclick=endCoach;
  function endCoach(){c.classList.add('hidden');DB.onboard=false;save();chime();toast('今夜营业 · 欢迎光临')}
  draw();
}

/* ============================================================
   首页
   ============================================================ */
function totalRecords(){return DB.time.length+DB.money.length+DB.mood.length+DB.dream.ideas.length+DB.mem.entries.length}
function renderHome(){
  var WD=['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
  $('#heroDate').textContent=cnDay()+' · '+WD[new Date().getDay()];
  var days=Math.max(1,daysBetween(DB.created,TODAY())+1);
  $('#heroCount').innerHTML='已典光阴 <b>'+days+'</b> 天 · <b>'+totalRecords()+'</b> 件当品';

  var t=timeStats('week');
  $('#stTime').innerHTML=t.days?('本周完成 <b>'+t.pct+'%</b>'+(t.hasPrev?(' · 较上期 '+(t.pct-t.prev.pct>=0?'+':'')+(t.pct-t.prev.pct)+'%'):'')):'还没有记录，<b>说两句</b>试试';

  var m=moneyStats();
  $('#stMoney').innerHTML='本周 <b>¥'+num(m.cur)+'</b> · '+(m.diff>=0?'比上周多':'比上周省')+' ¥'+num(Math.abs(m.diff));

  var mth=DB.mood.filter(function(x){return x.date>=rangeStart('month')}).length;
  $('#stMood').innerHTML='本月 <b>'+mth+'</b> 条 · 共 '+DB.mood.length+' 条心情';

  var f=DB.dream.flags.filter(function(x){return !x.done}).length;
  $('#stDream').innerHTML='<b>'+f+'</b> 个 flag 在路上 · '+DB.dream.letters.length+' 封信未拆';

  $('#homeQuote').innerHTML='「'+esc(randomQuote())+'」<br><span>—— 记于第 ∞ 号当铺前</span>';
}

/* ============================================================
   ① 时间
   ============================================================ */
var timeKind='week',timeStyle='default';
var timeViewDate=TODAY();
function renderTime(){
  var b=$('#bTime');
  var selE=DB.time.filter(function(e){return e.date===timeViewDate})[0];
  var st=timeStats(timeKind);
  var catBars=st.cats.length?st.cats.slice(0,3).map(function(c){
    return '<div class="lg"><i style="background:'+c.c+'"></i><span>'+esc(c.n)+'</span><span>'+c.h.toFixed(1)+'h</span></div>';
  }).join(''):'<div class="mini">本期还没有分类数据</div>';
  var cmp='';
  for(var off=0;off<3;off++){
    var d=dayAgo(off);
    var e=DB.time.filter(function(x){return x.date===d})[0];
    var ph=0,ah=0,nn=0;
    if(e){
      (e.plan||[]).forEach(function(p2){ph+=parseFloat(p2.min)||0});
      (e.actual||[]).forEach(function(a2){ah+=parseFloat(a2.min)||0});
      (e.plan||[]).forEach(function(p2){(e.actual||[]).forEach(function(a2){if(sim(p2.t,a2.t)>=.34)nn++})});
    }
    var rt=e&&(e.plan||[]).length?Math.round(nn/(e.plan||[]).length*100):0;
    cmp+='<div class="tc3'+(d===timeViewDate?' on':'')+'" data-d="'+d+'">'+
      '<div class="tc3-d">'+(off===0?'今天':off===1?'昨天':'前天')+'</div>'+
      '<div class="tc3-date">'+d.slice(5).replace('-','/')+'</div>'+
      (e?'<div class="tc3-h">计划 '+(ph/60).toFixed(1)+'h<br>实际 '+(ah/60).toFixed(1)+'h</div><div class="tc3-bar"><i style="width:'+Math.min(100,rt)+'%"></i></div><div class="tc3-r">完成 '+rt+'%</div>'
        :'<div class="tc3-h" style="color:var(--dim2)">这天还空着</div>')+
      '</div>';
  }
  b.innerHTML=
  '<div class="sec"><div class="sec-t axis-toggle" id="tAxisHead" style="cursor:pointer">光阴 · 一笔一记<span class="r" style="color:#F4C2C2">点击展开时间轴 <span id="tAxisArrow">▸</span></span></div>'+
    '<div id="tAxisWrap">'+
    '<div class="row" style="margin-bottom:10px">'+
      '<button class="btn pri" id="tPlan"><svg viewBox="0 0 24 24"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/></svg>记录计划</button>'+
      '<button class="btn pri" id="tAct"><svg viewBox="0 0 24 24"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/></svg>记录实际</button>'+
    '</div>'+
    '<div class="dt-nav"><button class="btn sm" id="dtPrev">◀</button>'+
      '<div class="dt-cur" id="dtCur">'+cnDate(timeViewDate)+(timeViewDate===TODAY()?' · 今天':' · 点我回今天')+'</div>'+
      '<button class="btn sm" id="dtNext">▶</button></div>'+
    '<div id="tAxisDetail" style="display:none">'+
    (selE&&((selE.plan||[]).length||(selE.actual||[]).length)?
      '<div class="box" style="margin-top:12px">'+
        '<div class="mini" style="margin-bottom:8px">'+cnDate(timeViewDate)+' 时间线 · 左计划 右实际<span class="r" style="float:right;color:var(--dim2)">时辰为刻度</span></div>'+
        vtlHTML(selE)+daySumHTML(selE)+'</div>'
      :'<div class="empty" style="margin-top:12px">这一天还没有记录，点上面按钮记一笔</div>')+
    '</div>'+
    '</div>'+
  '</div>'+

  '<div class="sec"><div class="sec-t">最近三天 · 计划对实际<span class="r">点一天看时间轴</span></div>'+
    '<div class="tc3-row">'+cmp+'</div>'+
    '<button class="btn" id="tDetail" style="width:100%;margin-top:10px">更多日期 · 详情</button></div>'+

  '<div class="sec"><div class="sec-t">光阴对账单<span class="r">时间的合理支出</span></div>'+
    '<div class="box">'+
      '<div class="chips" id="tStmtRange" style="margin-bottom:10px">'+
        [['day','今天'],['week','本周'],['month','本月'],['quarter','季度'],['custom','自选']].map(function(x){
          var on=(DB.timeRange&&DB.timeRange.kind===x[0])||(!DB.timeRange&&x[0]==='week');
          return '<button class="chip'+(on?' on':'')+'" data-r="'+x[0]+'">'+x[1]+'</button>'}).join('')+
      '</div>'+
      ((DB.timeRange&&DB.timeRange.kind==='custom')?
        '<div class="row" style="gap:8px;margin-bottom:10px">'+
          '<input class="inp" type="date" id="tRFrom" value="'+(DB.timeRange.from||TODAY())+'" style="flex:1">'+
          '<input class="inp" type="date" id="tRTo" value="'+(DB.timeRange.to||TODAY())+'" style="flex:1"></div>':'')+
      '<div class="mini" style="margin-bottom:8px;color:var(--dim2)">当前范围：'+timeRange().label+' · '+timeRange().days+' 天</div>'+
      '<div class="mini" style="margin-bottom:6px">选文案风格</div>'+
      '<div class="chips" id="tStmtStyle" style="margin-bottom:10px">'+
        Object.keys(STYLE).map(function(k){return '<button class="chip'+(timeStyle===k?' on':'')+'" data-s="'+k+'">'+STYLE[k]+'</button>'}).join('')+
      '</div>'+
      '<div class="mini" style="margin-bottom:10px">像对钱一样对时间：必要支出 · 投资自己 · 时间地漏，一笔一笔算清楚。</div>'+
      '<button class="btn pri" id="tStmt" style="width:100%">生成'+timeRange().label+'光阴对账单</button></div></div>'+

  '<div class="sec"><div class="sec-t">本期光阴 · 落于何类<span class="r">自识门类 · 可改</span></div>'+
    '<div class="box">'+catBars+'</div></div>'+



  '<div class="sec"><div class="sec-t">光阴门类 · 可改名/新增<span class="r">可改名 · 可新增</span></div>'+
    '<div class="box">'+timeCatList().slice(0,(DB.__ui&&DB.__ui.tCat)?1e9:3).map(function(c){
      return '<div class="item"><span class="dot" style="color:'+c.c+';background:'+c.c+'"></span><div class="c">'+
        '<input class="inp" data-tcat="'+c.k+'" value="'+esc(c.n)+'" style="padding:6px 9px;font-size:12px;background:transparent;border:none"></div></div>';
    }).join('')+(timeCatList().length>3?'<button class="btn" id="tCatMore" style="width:100%;margin-top:10px">'+(DB.__ui&&DB.__ui.tCat?'收起分类':'展开更多分类')+'</button>':'')+
    '<div class="row" style="margin-top:10px"><input class="inp" id="newTCat" placeholder="新增一个时间分类，如：带娃" style="flex:1"><button class="btn sm" id="addTCat">加</button></div>'+
    '</div></div>';

  $('#tPlan').onclick=function(){quickTime('plan')};
  $('#tAct').onclick=function(){quickTime('actual')};
  $('#dtPrev').onclick=function(){timeViewDate=iso(new Date(new Date(timeViewDate+'T00:00:00').getTime()-86400000));renderTime()};
  $('#dtNext').onclick=function(){var nx=iso(new Date(new Date(timeViewDate+'T00:00:00').getTime()+86400000));if(nx<=TODAY()){timeViewDate=nx;renderTime()}else{toast('还没到的日子，先好好过今天')}};
  $('#dtCur').onclick=function(){if(timeViewDate!==TODAY()){timeViewDate=TODAY();renderTime()}};
  $$('#bTime .tc3').forEach(function(c){c.onclick=function(){timeViewDate=c.dataset.d;renderTime()}});
  $('#tDetail').onclick=openTimeDetail;
  if($('#tAxisHead')){$('#tAxisHead').onclick=function(){var w=$('#tAxisDetail');var open=w.style.display!=='none';w.style.display=open?'none':'block';var a=$('#tAxisArrow');if(a)a.textContent=open?'▸':'▾';};}
  $$('#tStmtRange .chip').forEach(function(c){c.onclick=function(){
    DB.timeRange=DB.timeRange||{kind:'week'};
    DB.timeRange.kind=c.dataset.r;
    if(c.dataset.r==='custom'){DB.timeRange.from=DB.timeRange.from||TODAY();DB.timeRange.to=DB.timeRange.to||TODAY()}
    save();renderTime();
  }});
  var tRF=$('#tRFrom');if(tRF)tRF.onchange=function(){DB.timeRange.from=tRF.value||TODAY();save();renderTime()};
  var tRT=$('#tRTo');if(tRT)tRT.onchange=function(){DB.timeRange.to=tRT.value||TODAY();save();renderTime()};
  $('#tStmt').onclick=genTimeStatement;
  $$('#tStmtStyle .chip').forEach(function(c){c.onclick=function(){timeStyle=c.dataset.s;renderTime()}});
  $$('#bTime [data-tcat]').forEach(function(i){i.onchange=function(){
    DB.catTime.names[i.dataset.tcat]=i.value.trim()||timeCatOf(i.dataset.tcat).n;save();renderTime();toast('分类已改名')}});
  $('#addTCat').onclick=function(){
    var v=$('#newTCat').value.trim();if(!v)return toast('写个名字');
    DB.catTimeExtra.push({k:'tx'+uid(),n:v,c:EXTRA_COLORS[DB.catTimeExtra.length%EXTRA_COLORS.length]});
    save();renderTime();toast('已新增时间分类');
  };
  if($('#tCatMore'))$('#tCatMore').onclick=function(){DB.__ui=DB.__ui||{};DB.__ui.tCat=!DB.__ui.tCat;renderTime();};
}
function openTimeDetail(){
  var list=DB.time.slice().sort(function(a,c){return a.date<c.date?1:-1});
  panel('<div class="ph">旧日卷宗 · 全部日期</div>'+
    '<div class="mini" style="margin-bottom:12px;letter-spacing:1px">共 '+list.length+' 天 · 点「看这天」切到那日时间轴</div>'+
    (list.length?list.map(function(e){
      var n=0;(e.plan||[]).forEach(function(p2){(e.actual||[]).forEach(function(a2){if(sim(p2.t,a2.t)>=.34)n++})});
      var r=(e.plan||[]).length?Math.round(n/(e.plan||[]).length*100):0;
      return '<div class="item"><span class="dot" style="color:#F0D394;background:#F0D394"></span><div class="c">'+
        '<div class="t">'+cnDate(e.date)+' <span class="tagx">完成 '+r+'%</span></div>'+
        '<div class="m">计划 '+(e.plan||[]).length+' 件 · 实际 '+(e.actual||[]).length+' 件</div></div>'+
        '<button class="btn sm" data-day="'+e.date+'">看这天</button>'+
        '<button class="x" data-tdel="'+e.id+'">×</button></div>';
    }).join(''):'<div class="empty">还没有记录</div>'));
  $$('#mModPanel [data-day]').forEach(function(x){x.onclick=function(){timeViewDate=x.dataset.day;closeModal('mMod');renderTime()}});
  $$('#mModPanel [data-tdel]').forEach(function(x){x.onclick=function(){
    DB.time=DB.time.filter(function(e){return e.id!==x.dataset.tdel});save();renderTime();openTimeDetail()}});
}



function genTimeStatement(){
  var p=panel('<div class="loader"><div class="lp"></div><div class="lt">掌柜正拨动算盘<br>给你的光阴对对账…</div></div>');
  var TR=timeRange();
  var from=TR.from;
  var LEAK=['刷手机','刷剧','追剧','发呆','短视频','打游戏','玩游戏','摸鱼','闲逛','赖床'];
  var nec=0,inv=0,rst=0,leakMin=0,leaks={};
  DB.time.filter(function(e){return e.date>=from}).forEach(function(e){
    (e.actual||[]).forEach(function(a){
      var mm=parseFloat(a.min)||0;var c=a.cat||guessTimeCat(a.t);
      var isLeak=false;
      for(var li=0;li<LEAK.length;li++){if(String(a.t).indexOf(LEAK[li])>=0){isLeak=true;break}}
      if(isLeak){leakMin+=mm;leaks[a.t]=(leaks[a.t]||0)+mm}
      else if(c==='work'||c==='learn')nec+=mm;
      else if(c==='sport'||c==='life')inv+=mm;
      else rst+=mm;
    });
  });
  /* 三筐 + 地漏：必要支出/投资自己/休息恢复三个筐；
     时间地漏 = 可用时长（12h/天）− 已记录时长，自动补差，单独展示；
     叫得出名字的地漏活动（刷手机等）单独列 top_leak */
  var actH=(nec+inv+rst+leakMin)/60;            /* 本周用时：已记录时长 */
  var gapH=Math.max(0,12*TR.days-actH);         /* 无名空洞：自动补差 */
  var leakH=gapH+leakMin/60;                    /* 时间地漏总量 */
  var tot=(nec+inv+rst+leakH*60)||1;
  var pn=Math.round(nec/tot*100),pi=Math.round(inv/tot*100),pr2=Math.round(rst/tot*100),pl=Math.round(leakH*60/tot*100);
  var leakTop=Object.keys(leaks).sort(function(a,b){return leaks[b]-leaks[a]})[0]||'';
  var leakTopH=leakTop?(leaks[leakTop]/60).toFixed(1):'0.0';
  var saveH=Math.min(0.5*TR.days,leakH);        /* 每天夺回半小时的收益 */
  var seedV=TODAY()+'ts'+Math.random().toString(36).slice(2,6);
  var sys='你在写「光阴对账单」。像钱要花得明白一样，把这段时间归入三个筐：必要支出（工作/有 deadline 的学习/通勤）、投资自己（自己找的学习/运动/好好生活）、休息恢复；时间地漏=可用时长（12h/天）−已记录时长，自动补差，单独展示。';
  var pct=TR.list.length?Math.round(TR.list.reduce(function(s,x){var nn=0;(x.plan||[]).forEach(function(p2){(x.actual||[]).forEach(function(a2){if(sim(p2.t,a2.t)>=.34)nn++})});var r=(x.plan||[]).length?nn/(x.plan||[]).length:0;return s+r},0)/TR.list.length*100):0;
  var user=TR.label+'（'+cnDate(TR.from)+' — '+cnDate(TR.to)+'，共 '+TR.days+' 天）。'
    +'三个核心数字：本周用时 '+actH.toFixed(1)+'h，计划完成率 '+pct+'%，时间地漏 '+leakH.toFixed(1)+'h。'
    +'三筐分布：必要支出 '+(nec/60).toFixed(1)+'h('+pn+'%)，投资自己 '+(inv/60).toFixed(1)+'h('+pi+'%)，休息恢复 '+(rst/60).toFixed(1)+'h('+pr2+'%)。'
    +(leakTop?'最大的时间地漏是「'+leakTop+'」，'+leakTopH+'h。':'没有叫得出名字的地漏记录。')
    +'每天夺回半小时，'+TR.label+'就能多出 '+saveH.toFixed(1)+'h。'
    +'请按统一 JSON 结构输出：title 起一句诗意的账单标题；paragraphs 恰好三段——先本金（必要支出动不得、投资自己连本带利），再地漏（不疼不痒却积少成多，点出漏了多少），结尾落到下一周的账；quote 一句金句；metrics 输出三筐的时长和占比，时间地漏单独输出时长（形如 {"label":"时间地漏","value":"'+leakH.toFixed(1)+'h","ratio":'+(pl/100).toFixed(2)+'}）；sections 留空数组。';
  var fb=function(){
    return JSON.stringify({
      title:TR.label+'，光阴的来处与去处',
      paragraphs:[
        TR.label+'，你把 '+actH.toFixed(1)+' 小时交给了日子。必要支出占 '+pn+'%，是时间的本金，动不得；投资自己占 '+pi+'%，运动和好好生活，未来都会连本带利还给你。',
        (leakMin>0
          ?'真正要留神的，是那 '+leakH.toFixed(1)+' 小时的时间地漏'+(leakTop?'——光是「'+leakTop+'」，就悄悄漏掉了 '+leakTopH+' 小时':'')+'。它不疼不痒，却积少成多。'
          :'难得的是，这一期几乎没有叫得出名字的时间地漏，每一小时都花得有名有姓。'),
        '试试每天从地漏里夺回半小时：'+TR.label+'就是 '+saveH.toFixed(1)+' 小时，够读完一本书，或者好好睡三个懒觉。下一周的时间账本，一笔一笔，都算你自己真心想花的。'
      ],
      quote:randomQuote(seedV),
      metrics:[
        {label:'必要支出',value:(nec/60).toFixed(1)+'h',ratio:pn/100},
        {label:'投资自己',value:(inv/60).toFixed(1)+'h',ratio:pi/100},
        {label:'休息恢复',value:(rst/60).toFixed(1)+'h',ratio:pr2/100},
        {label:'时间地漏',value:leakH.toFixed(1)+'h',ratio:pl/100}
      ],
      sections:[]
    });
  };
  AI.call(sys,user,fb,timeStyle,{report:true}).then(function(r){
    var o=r.json||parseReportJSON(r.text)||JSON.parse(fb());
    var paras=(o.paragraphs&&o.paragraphs.length?o.paragraphs:['这一期，账本还没写满。再记几天，掌柜再替你细算。']);
    var quote=String(o.quote||randomQuote(seedV));
    var secs=(o.sections||[]).filter(function(x){return x&&x.label});
    p.innerHTML='<button class="closex" data-close>×</button><div class="ticket">'+
      '<div class="tk-h"><svg class="hw" viewBox="0 0 12 34"><path d="M1 1h10v10H1z"/><path d="M4 4v4h4V4"/><path d="M1 13h10v10H1z"/><path d="M4 16v4h4v-4"/></svg>'+
      '<div class="zh">光阴对账单</div><div class="en">TIME STATEMENT</div><div class="no">No.<b>'+tkNo(TODAY()+'ts')+'</b></div></div>'+
      '<div class="rep">'+
      '<div style="text-align:center;font-family:var(--serif);font-size:19px;letter-spacing:2px;color:var(--gold)">'+TR.label+'光阴对账单</div>'+
      '<div style="text-align:center;font-size:10.5px;color:var(--dim2);letter-spacing:1.4px;margin:6px 0 14px">时间的合理支出 · 像对钱一样对时间</div>'+
      '<div class="big3">'+
        '<div><b>'+actH.toFixed(1)+'h</b><u>'+TR.label+'用时</u></div>'+
        '<div><b style="color:#8FD8C4">'+pct+'%</b><u>计划完成</u></div>'+
        '<div><b style="color:#F0997B">'+leakH.toFixed(1)+'h</b><u>时间地漏</u></div>'+
      '</div>'+
      '<div style="margin:12px 0">'+
        '<div class="mood-bar"><span>必要支出</span><div class="track"><div class="fill" style="width:'+pn+'%;background:#F0D394"></div></div><span>'+(nec/60).toFixed(1)+'h</span></div>'+
        '<div class="mood-bar"><span>投资自己</span><div class="track"><div class="fill" style="width:'+pi+'%;background:#8FD8C4"></div></div><span>'+(inv/60).toFixed(1)+'h</span></div>'+
        '<div class="mood-bar"><span>休息恢复</span><div class="track"><div class="fill" style="width:'+pr2+'%;background:#BFA3E8"></div></div><span>'+(rst/60).toFixed(1)+'h</span></div>'+
        '<div class="mood-bar"><span>时间地漏</span><div class="track"><div class="fill" style="width:'+pl+'%;background:#F0997B"></div></div><span>'+leakH.toFixed(1)+'h</span></div>'+
      '</div>'+
      '<div class="kv"><span>最大的时间地漏</span><b>'+(leakTop?esc(leakTop)+' · '+leakTopH+'h':'无 · 很自律')+'</b></div>'+
      '<div class="kv"><span>每天夺回半小时 · '+TR.label+'多出</span><b style="color:#8FD8C4">'+saveH.toFixed(1)+'h</b></div>'+
      secs.map(function(x){return '<div class="kv"><span>'+esc(String(x.label))+'</span><b>'+esc(String(x.value==null?'':x.value))+'</b></div>'}).join('')+
      '<h4>掌柜说</h4>'+paras.map(function(x){return '<p class="body">'+esc(String(x)).replace(/\n/g,'<br>')+'</p>'}).join('')+
      '<div class="quote">'+esc(quote)+'</div>'+
      '<div class="mini" style="text-align:center;margin-top:14px">'+(r.mock?'（模拟文案 · 服务端未配置时自动回落）':'（DeepSeek 生成）')+'</div>'+
      '<canvas id="shareCv"></canvas>'+shareCard()+'</div>'+
      '<div class="tk-f"><div class="say">时间花得明白，日子才过得清楚<i>一寸光阴 · 一笔清账</i></div><div class="tk-seal">典进<br>不赎</div></div><div class="perf"></div></div>';
    var cv=drawCard({sub:'光阴对账单',title:String(o.title||TR.label+'光阴对账单'),date:cnDate(TR.from)+' — '+cnDate(TR.to),
      rows:[[TR.label+'用时',actH.toFixed(1)+'h'],['时间地漏',leakH.toFixed(1)+'h']],quote:quote});
      var sh=bindShare(cv,'铜钱对账.png');
    $('#shSave').onclick=sh.save;$('#shShare').onclick=sh.share;
  });
}
/* ---------- 一句话快记：说一条，AI 提取一条 ---------- */
var QT_POEM={
  plan:['「凡事豫则立，不豫则废。」','念头刚冒出来的时候最亮，<br>趁它还没凉，说给掌柜听。'],
  actual:['「不积跬步，无以至千里。」','今天真正走过的路，<br>一步也不必美化，如实入账就好。']
};
function quickTime(kind){
  /* 弹窗、解析、入库全部由 React 组件完成，这里只负责唤起与刷新 */
  if(!(OPTS.ui&&typeof OPTS.ui.quickTime==='function'))return;
  OPTS.ui.quickTime({
    kind:kind,
    isPlan:kind==='plan',
    poem:QT_POEM[kind],
    date:timeViewDate||TODAY(),
    refresh:function(dv,msg){
      if(dv)timeViewDate=dv;
      DB=load();
      renderTime();
      chime();
      if(msg)toast(msg);
    }
  });
}
/* ---------- 今日时间线：把事项铺到 7:00-24:00 的轴上 ---------- */
function dayZone(t){
  t=String(t||'');
  if(/早上|早晨|上午|早饭|早读|早/.test(t))return 480;
  if(/中午|午饭|午餐|午休|午/.test(t))return 750;
  if(/下午|午后/.test(t))return 840;
  if(/晚上|夜里|深夜|晚|睡前|加班/.test(t))return 1140;
  return null;
}
function dayAssign(items){
  items=items||[];
  var out=[],cur=480;
  items.forEach(function(p){
    var min=parseFloat(p.min)||30;
    var start=typeof p.at==='number'?p.at:cur;
    if(start<420)start=420;
    if(start>1425-(min>0?min:30))start=Math.max(420,1425-(min>0?min:30));
    out.push({p:p,start:Math.round(start)});
    cur=start+min+10;
  });
  return out;
}
/* ---------- 竖向时间线：左计划 · 右实际 · 整点时间轴（含早/中/下/晚分段） ---------- */
var VT_ZONES=[{n:'早上',s:420,e:750},{n:'中午',s:750,e:840},{n:'下午',s:840,e:1140},{n:'晚上',s:1140,e:1440}];
function zoneName(h){for(var i=0;i<VT_ZONES.length;i++){if(h>=VT_ZONES[i].s&&h<VT_ZONES[i].e)return VT_ZONES[i].n}return '晚上'}
/* 把事项按「小时」切分：跨小时的事项按落在各小时内的分钟数分别计入 */
function hourBuckets(items){
  var as=dayAssign(items||[]);
  var spans=as.map(function(o){var m=parseFloat(o.p.min)||30;return {p:o.p,start:o.start,end:o.start+m,m:m}});
  var s=1e9,e=-1;
  spans.forEach(function(o){s=Math.min(s,o.start);e=Math.max(e,o.end)});
  if(!spans.length||s>e)return [];
  var h0=Math.max(420,Math.floor(s/60)*60),h1=Math.min(1440,Math.ceil(e/60)*60);
  var out=[];
  for(var h=h0;h<h1;h+=60){
    var arr=[];
    spans.forEach(function(o){var ov=Math.min(o.end,h+60)-Math.max(o.start,h);
      if(ov>0)arr.push({p:o.p,min:Math.round(ov)})});
    out.push({h:h,items:arr,min:arr.reduce(function(a,b){return a+b.min},0)});
  }
  return out;
}
function zoneBuckets(items){
  var as=dayAssign(items||[]);
  return VT_ZONES.map(function(z){
    var arr=as.filter(function(o){var mid=o.start+(parseFloat(o.p.min)||30)/2;return mid>=z.s&&mid<z.e});
    return {n:z.n,items:arr,min:arr.reduce(function(s,o){return s+(parseFloat(o.p.min)||0)},0)};
  });
}
function vtlHTML(e){
  var P=hourBuckets(e.plan),A=hourBuckets(e.actual);
  var pm={},am={},hs={};
  P.forEach(function(o){pm[o.h]=o;hs[o.h]=1});
  A.forEach(function(o){am[o.h]=o;hs[o.h]=1});
  var hours=Object.keys(hs).map(Number).sort(function(a,b){return a-b});
  if(!hours.length)return '';
  function col(b){
    if(!b||!b.items.length)return '<div class="vt-none">·</div>';
    return b.items.map(function(o){var c=timeCatOf(o.p.cat);
      return '<div class="vt-it"><b>'+esc(o.p.t)+'</b><span><i style="background:'+c.c+'"></i>'+esc(c.n)+' · '+o.min+'分</span></div>';
    }).join('');
  }
  var html='<div class="vtl-head"><span class="vlp">计划</span><span class="lm">时刻</span><span class="vla">实际</span></div>';
  var lz='';
  hours.forEach(function(h){
    var z=zoneName(h);
    if(z!==lz){html+='<div class="vt-zone"><i></i><span>'+z+'</span><i></i></div>';lz=z}
    html+='<div class="vt-row">'+
        '<div class="vt-col plan">'+col(pm[h])+'</div>'+
        '<div class="vt-axis"><span style="letter-spacing:0">'+('0'+Math.floor(h/60)).slice(-2)+':00</span><i></i></div>'+
        '<div class="vt-col act">'+col(am[h])+'</div>'+
      '</div>';
  });
  return html;
}
function daySumHTML(e){
  var P=zoneBuckets(e.plan),A=zoneBuckets(e.actual);
  var pt=0,at=0;P.forEach(function(z){pt+=z.min});A.forEach(function(z){at+=z.min});
  if(!pt&&!at)return '';
  var mx=1;P.forEach(function(z,i){mx=Math.max(mx,z.min,A[i].min)});
  var rows=P.map(function(z,i){
    return '<div class="bb-row"><span class="bb-n">'+z.n+'</span><div class="bb-bars">'+
      '<div class="bb-bar"><i class="w" style="width:'+(mx?(z.min/mx*100).toFixed(1):0)+'%"></i><u>'+(z.min?z.min+'分':'—')+'</u></div>'+
      '<div class="bb-bar"><i class="g" style="width:'+(mx?(A[i].min/mx*100).toFixed(1):0)+'%"></i><u>'+(A[i].min?A[i].min+'分':'—')+'</u></div>'+
      '</div></div>';
  }).join('');
  var rate=pt?Math.round(Math.min(at,pt*2)/pt*100):100;
  var d=at-pt;
  return '<div style="margin-top:14px;padding-top:12px;border-top:1px dashed var(--line2)">'+
    '<div class="mini" style="margin-bottom:2px">今日光阴小账 · 随记随更，不用点生成</div>'+
    '<div class="mini" style="margin-bottom:6px;color:var(--dim)">计划 <b style="color:#9BA8F0">'+pt+'</b> 分 · 实际 <b style="color:#F0D394">'+at+'</b> 分 · 兑付 <b style="color:#F0D394">'+(pt?rate+'%':'—')+'</b>'+(at>pt?' · 比计划多花 '+d+' 分':(at<pt&&at>0?' · 还有 '+(-d)+' 分没兑现':''))+'</div>'+
    rows+'</div>';
}
function genTimeReport(){
  var p=panel('<div class="loader"><div class="lp"></div><div class="lt">AI 正翻阅你的光阴…<br>把这一期与上期，摆在一处比对</div></div>');
  var st=timeStats(timeKind);
  var seedV=TODAY()+timeKind+timeStyle+Math.random().toString(36).slice(2,6);
  var sys='你在为一款叫「光阴的故事」的 App 写「光阴去向」回顾报告。';
  var prevDesc=st.hasPrev?('上一期：计划 '+st.prev.planN+' 件（'+st.prev.planH+' 小时），实际 '+st.prev.actN+' 小时，完成率 '+st.prev.pct+'%。'):'（这是第一期，没有上期数据）';
  var user='数据：'+RANGE_NAME[timeKind]+'共记录 '+st.days+' 天；计划 '+st.planN+' 件事（'+st.planH+' 小时），实际 '+st.actN+' 件（'+st.actH+' 小时）；完成率 '+st.pct+'%；计划外 '+st.extraN+' 件占 '+st.extraPct+'%；'+prevDesc+' 分类用时：'+st.cats.map(function(c){return c.n+' '+c.h.toFixed(1)+'小时'}).join('、')+'。请写一份 220 字左右、有趣有洞察的回顾，重点写出和上一期相比的变化（多了什么、少了什么、波动在哪），不要罗列数字，要给因果和感受。';
  var fb=function(){
    return MOCK.timeOpen({rate:st.rate,pct:st.pct,unit:st.unit,seed:seedV})+'\n'+
      MOCK.timeBody(st)+'\n'+MOCK.timeCmp({has:st.hasPrev,pct:st.pct,prevPct:st.prev.pct,unit:st.unit});
  };
  AI.call(sys,user,fb,timeStyle,{report:true}).then(function(r){
    var keys=MOCK.keys({seed:seedV});
    var tj=timeTraj(timeKind==='week'?7:timeKind==='month'?30:14);
    var delta=st.pct-(st.prev.pct||0);
    var html='<div class="ticket">'+
      '<div class="tk-h"><svg class="hw" viewBox="0 0 12 34"><path d="M1 1h10v10H1z"/><path d="M4 4v4h4V4"/><path d="M1 13h10v10H1z"/><path d="M4 16v4h4v-4"/></svg>'+
      '<div class="zh">光阴当票</div><div class="en">PAWN TICKET OF TIME</div><div class="no">No.<b>'+tkNo(TODAY()+timeKind)+'</b></div></div>'+
      '<div class="rep">'+
      '<div style="text-align:center;font-family:var(--serif);font-size:19px;letter-spacing:2px;color:var(--gold);margin-bottom:4px">'+RANGE_NAME[timeKind]+' · 光阴去向</div>'+
      '<div style="text-align:center;font-size:10.5px;color:var(--dim2);letter-spacing:1.4px;margin-bottom:14px">'+cnDate(st.from)+' 至 '+cnDate(TODAY())+'</div>'+
      '<div class="big3">'+
        '<div><b>'+st.pct+'%</b><u>完成率</u><i class="'+cmpCls(st.pct,st.prev.pct)+'">'+cmpTxt(st.pct,st.prev.pct,st.hasPrev)+'</i></div>'+
        '<div><b>'+st.actH+'h</b><u>实际投入</u><i class="'+cmpCls(st.actH,st.prev.actH)+'">'+cmpTxt(st.actH,st.prev.actH,st.hasPrev,'h')+'</i></div>'+
        '<div><b>'+st.extraPct+'%</b><u>计划外</u><i class="'+cmpCls(st.extraPct,st.prev.extraPct)+'">'+cmpTxt(st.extraPct,st.prev.extraPct,st.hasPrev)+'</i></div>'+
      '</div>'+
      '<div class="traj">'+trajSVG(tj.days,{gid:'tr',series:[{color:'#F0D394'},{color:'rgba(155,168,240,.85)'}],max:tj.mx})+
      '<div class="tlegend"><span><i style="background:#F0D394"></i>实际</span><span><i style="background:#9BA8F0"></i>计划（虚线）</span></div></div>'+
      '<h4>AI 说</h4><p class="body">'+esc(r.text).replace(/\n/g,'<br>')+'</p>'+
      '<div class="quote">'+esc(randomQuote(seedV))+'</div>'+
      '<h4>你的光阴 · 关键词</h4><div class="kw">'+keys.map(function(k){return '<span>'+k+'</span>'}).join('')+'</div>'+
      '<div class="mini" style="text-align:center;margin-top:16px">'+(r.mock?'（模拟文案 · 于设置填入 DeepSeek Key 可换真实生成）':'（DeepSeek 生成）')+'</div>'+
      '<canvas id="shareCv"></canvas>'+shareCard()+
      '</div><div class="tk-f"><div class="say">凭此票，兑一份洞见<i>存进来的是光阴 · 换走的是对自己的看见</i></div><div class="tk-seal">典进<br>不赎</div></div><div class="perf"></div></div>';
    p.innerHTML='<button class="closex" data-close>×</button>'+html;
    var cv=drawCard({sub:'时间去哪儿了',title:RANGE_NAME[timeKind]+'光阴报告',date:cnDate(st.from)+' — '+cnDate(TODAY()),
      keys:keys,rows:[['完成率',st.pct+'%'],['实际投入',st.actH+'h'],['计划外',st.extraPct+'%']],
      traj:tj.days,trajMax:tj.mx,trajTitle:'近'+tj.days.length+'天 实际 vs 计划（小时）',
      quote:randomQuote(seedV)});
    var sh=bindShare(cv,'光阴报告-'+RANGE_NAME[timeKind]+'.png');
    $('#shSave').onclick=sh.save;$('#shShare').onclick=sh.share;
  });
}
function cmpCls(a,b){if(!b&&b!==0)return'flat';var d=a-b;return d>0.5?'up':d<-0.5?'down':'flat'}
function cmpTxt(a,b,has,unit){
  if(!has)return '首期';
  var d=a-b;
  var u=unit||'pp';
  if(Math.abs(d)<0.5)return '持平';
  return (d>0?'↑':'↓')+Math.abs(Math.round(d*10)/10)+u;
}

function tkNo(seed){return String(1000+(hash(String(seed||'')+DB.created)%8999))}

/* ============================================================
   ② 金钱
   ============================================================ */
var moneyStyle='default';
function renderMoney(){
  var b=$('#bMoney');
  var m=moneyStats();
  var mm=moneyMonthStats();
  var R0=moneyRange();
  var budget=DB.budget.week||800;
  var used=Math.min(1,m.cur/budget);
  var C=2*Math.PI*44;
  var donut='';
  var off=0;
  m.arr.forEach(function(a){
    var len=a.v/m.total*C;
    donut+='<circle cx="50" cy="50" r="44" fill="none" stroke="'+a.c+'" stroke-width="13" '+
      'stroke-dasharray="'+len+' '+(C-len)+'" stroke-dashoffset="'+(-off)+'" stroke-linecap="butt"/>';
    off+=len;
  });
  if(!m.arr.length)donut='<circle cx="50" cy="50" r="44" fill="none" stroke="rgba(247,241,225,.1)" stroke-width="13"/>';
  var recent=DB.money.slice().sort(function(a,c){return a.date<c.date?1:-1}).slice(0,14);
  var tj=moneyTraj(14);
  var n=Math.max(0,Math.min(10,Math.round(m.cur/Math.max(1,budget)*10))),ab='',over=m.cur>budget;
  for(var i=0;i<10;i++)ab+='<i class="'+(i<n?(over?'hot':'on'):'')+'"></i>';
  b.innerHTML=
  '<div class="sec"><div class="sec-t">本周花用<span class="r">'+cnDate(m.ws)+' 起</span></div>'+
    '<div class="box" style="display:flex;align-items:center;gap:16px">'+
      '<div class="ring"><svg width="104" height="104" viewBox="0 0 104 104">'+
        '<circle cx="52" cy="52" r="44" fill="none" stroke="rgba(247,241,225,.1)" stroke-width="9"/>'+
        '<circle cx="52" cy="52" r="44" fill="none" stroke="'+(over?'#F0997B':'#F0D394')+'" stroke-width="9" stroke-linecap="round" '+
        'stroke-dasharray="'+(used*C)+' '+C+'"/>'+
      '</svg><div class="cv"><b>¥'+num(m.cur)+'</b><u>预算 '+budget+'</u></div></div>'+
      '<div style="flex:1">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span class="mini">算盘 · 预算盈亏</span>'+ab+'</div>'+
        '<div class="kv"><span>上周</span><b>¥'+num(m.prev)+'</b></div>'+
        '<div class="kv"><span>变化</span><b style="color:'+(m.diff>=0?'#F0997B':'#8FD8C4')+'">'+(m.diff>=0?'+':'-')+'¥'+num(Math.abs(m.diff))+'</b></div>'+
        '<div class="kv"><span>日均</span><b>¥'+num(m.cur/7)+'</b></div>'+
        '<div class="mini" style="margin-top:8px;color:'+(over?'#F0997B':'#8FD8C4')+'">'+(over?'已超出本周预算 ¥'+num(m.cur-budget)+' · 掌柜皱起了眉':'本周预算还剩 ¥'+num(budget-m.cur)+' · 花得很稳')+'</div>'+
      '</div></div></div>'+

  '<div class="sec"><div class="sec-t">本月对账<span class="r">较上月</span></div>'+
    '<div class="box"><div class="big3">'+
      '<div><b>¥'+num(mm.cur)+'</b><u>本月</u></div>'+
      '<div><b>¥'+num(mm.prev)+'</b><u>上月</u></div>'+
      '<div><b style="color:'+(mm.diff>=0?'#F0997B':'#8FD8C4')+'">'+(mm.diff>=0?'+':'-')+'¥'+num(Math.abs(mm.diff))+'</b><u>变化</u></div>'+
    '</div>'+
    (mm.hasPrev?'<div class="mini" style="margin-top:10px;text-align:center;color:var(--dim2)">'+mm.arr.slice(0,3).map(function(a){
      var d=a.v-a.pv;
      return a.n+' 本月 ¥'+num(a.v)+(d>0?' 多 ':' 少 ')+'¥'+num(Math.abs(d));
    }).join(' · '):'<div class="mini" style="margin-top:10px;text-align:center;color:var(--dim2)">上月还没有记录</div>')+
    '</div></div>'+

  '<div class="sec"><div class="sec-t">铜钱对账<span class="r">体检 + 隐形浪费 · 一次看清</span></div>'+
    '<div class="box">'+
      '<div class="mini" style="margin-bottom:6px">选时间范围</div>'+
      '<div class="chips" id="mRange" style="margin-bottom:10px">'+
        [['day','今天'],['week','本周'],['month','本月'],['quarter','季度'],['custom','自选']].map(function(x){
          var on=(DB.moneyRange&&DB.moneyRange.kind===x[0])||(!DB.moneyRange&&x[0]==='month');
          return '<button class="chip'+(on?' on':'')+'" data-r="'+x[0]+'">'+x[1]+'</button>'}).join('')+
      '</div>'+
      ((DB.moneyRange&&DB.moneyRange.kind==='custom')?
        '<div class="row" style="gap:8px;margin-bottom:10px">'+
          '<input class="inp" type="date" id="mRFrom" value="'+(DB.moneyRange.from||TODAY())+'" style="flex:1">'+
          '<input class="inp" type="date" id="mRTo" value="'+(DB.moneyRange.to||TODAY())+'" style="flex:1"></div>':'')+
      '<div class="mini" style="margin-bottom:6px;color:var(--dim2)">当前范围：'+R0.label+' · '+R0.list.length+' 笔 · 共 ¥'+num(rangeSum(R0.list))+'</div>'+
      '<div class="mini" style="margin-bottom:6px">选文案风格</div>'+
      '<div class="chips" id="mStmtStyle" style="margin-bottom:10px">'+
        Object.keys(STYLE).map(function(k){return '<button class="chip'+(moneyStyle===k?' on':'')+'" data-s="'+k+'">'+STYLE[k]+'</button>'}).join('')+
      '</div>'+
      '<div class="mini" style="margin-bottom:12px">包含：个人消费体检（必要 / 可优化 / 非必要支出）+ 找出隐形浪费 + 对比上一期哪个分类花超 + 下期能省多少钱</div>'+
      '<button class="btn pri" id="mStmt" style="width:100%">生成铜钱对账</button></div></div>'+

  '<div class="sec"><div class="sec-t">近十四日 · 花销轨迹</div>'+
    '<div class="box">'+trajSVG(tj.days,{gid:'mt',series:[{color:'#8FD8C4'}],max:tj.mx})+
    '<div class="tlegend"><span><i style="background:#8FD8C4"></i>当日支出（元）</span></div></div></div>'+

  '<div class="sec"><div class="sec-t">记一笔账<span class="r">说一句便好</span></div>'+
    '<div class="box" style="text-align:center">'+
      '<button class="btn pri big" id="mqOpen" style="width:100%">说一句，记一笔</button>'+
      '<div class="mini" style="margin-top:10px">比如「今天吃饭花了 30 块」<br>掌柜会自动提取金额和分类</div>'+
    '</div></div>'+

  '<div class="sec"><div class="sec-t">本周去处<span class="r">较上周</span></div>'+
    '<div class="box"><div class="donut"><svg viewBox="0 0 100 100">'+donut+'</svg><div class="legend">'+
      (m.arr.length?m.arr.slice(0,6).map(function(a){
        var d=a.v-a.pv;
        return '<div class="lg"><i style="background:'+a.c+'"></i><span>'+esc(a.n)+(m.hasPrev?(d>=0?' <u style="color:#F0997B;text-decoration:none">+'+num(d)+'</u>':' <u style="color:#8FD8C4;text-decoration:none">'+num(d)+'</u>'):'')+'</span><span>¥'+num(a.v)+'</span></div>'}).join(''):'<div class="mini">本周还没有记录</div>')+
    '</div></div></div></div>'+



  '<div class="sec"><div class="sec-t">我的门类 · 可改名/新增<span class="r">可改名 · 可新增</span></div>'+
    '<div class="box">'+catList().slice().sort(function(a,b){var P=['love','junk','peo','social','fun','heal','learn'];return (P.indexOf(a.k)>=0?0:1)-(P.indexOf(b.k)>=0?0:1);}).slice(0,(DB.__ui&&DB.__ui.mCat)?1e9:3).map(function(c){
      return '<div class="item"><span class="dot" style="color:'+c.c+';background:'+c.c+'"></span><div class="c">'+
        '<input class="inp" data-cat="'+c.k+'" value="'+esc(c.n)+'" style="padding:6px 9px;font-size:12px;background:transparent;border:none"></div></div>';
    }).join('')+(catList().length>3?'<button class="btn" id="mCatMore" style="width:100%;margin-top:10px">'+(DB.__ui&&DB.__ui.mCat?'收起分类':'展开更多分类')+'</button>':'')+
    '<div class="row" style="margin-top:10px"><input class="inp" id="newCat" placeholder="新增一个分类名" style="flex:1"><button class="btn sm" id="addCat">加</button></div>'+
    '</div></div>'+

  '<div class="sec"><div class="sec-t">账目明细<span class="r">共 '+DB.money.length+' 笔</span></div>'+
    '<div class="box" style="display:flex;align-items:center;gap:12px">'+
      '<div style="flex:1"><div class="t" style="font-size:13px">账册已存 <b style="color:var(--gold)">'+DB.money.length+'</b> 笔</div>'+
      '<div class="mini" style="margin-top:4px">点开看全部流水，可逐笔删去</div></div>'+
      '<button class="btn" id="mDetail" style="flex:none">详情</button></div></div>';

  $('#mqOpen').onclick=openMoneyQuick;
  $('#mDetail').onclick=openMoneyDetail;
  $$('#mStmtStyle .chip').forEach(function(c){c.onclick=function(){moneyStyle=c.dataset.s;renderMoney()}});
  $$('#mRange .chip').forEach(function(c){c.onclick=function(){
    DB.moneyRange=DB.moneyRange||{kind:'month'};
    DB.moneyRange.kind=c.dataset.r;
    if(c.dataset.r==='custom'){DB.moneyRange.from=DB.moneyRange.from||TODAY();DB.moneyRange.to=DB.moneyRange.to||TODAY()}
    save();renderMoney();
  }});
  var mrf=$('#mRFrom');if(mrf)mrf.onchange=function(){DB.moneyRange.from=mrf.value||TODAY();save();renderMoney()};
  var mrt=$('#mRTo');if(mrt)mrt.onchange=function(){DB.moneyRange.to=mrt.value||TODAY();save();renderMoney()};
  $('#mStmt').onclick=moneyStatement;
  $$('#bMoney [data-cat]').forEach(function(i){i.onchange=function(){DB.catName[i.dataset.cat]=i.value.trim()||catOf(i.dataset.cat).n;save();renderMoney();toast('分类已改名')}});
  if($('#mCatMore'))$('#mCatMore').onclick=function(){DB.__ui=DB.__ui||{};DB.__ui.mCat=!DB.__ui.mCat;renderMoney();};
  $('#addCat').onclick=function(){
    var v=$('#newCat').value.trim();if(!v)return toast('写个名字');
    DB.catExtra.push({k:'x'+uid(),n:v,c:EXTRA_COLORS[DB.catExtra.length%EXTRA_COLORS.length]});save();renderMoney();toast('已新增分类');
  };
}
function cleanNote(seg){
  var n=String(seg)
    .replace(/\d+(?:\.\d+)?\s*(?:块钱|块|元|rmb|¥)/gi,'')
    .replace(/aa/ig,'')
    .replace(/\d+(?:\.\d+)?/g,'')
    .replace(/^(今天|昨天|明天|早上|早晨|上午|中午|下午|晚上|夜里|深夜|刚才|刚刚|今晚|今早)/,'')
    .replace(/(花了|花去|花费)/,'')
    .replace(/^[\s的了，,。.、：:]+|[\s，,。.、：:]+$/g,'');
  return n||String(seg).trim();
}
function parseExpenseSentence(text){
  var segs=String(text).split(/[，,、;；。\n|]+/).map(function(s){return s.trim()}).filter(function(s){return s});
  var items=[];
  segs.forEach(function(seg){
    var amt=parseAmount(seg);
    if(amt&&amt>0)items.push({note:cleanNote(seg),amt:amt,cat:classify(seg)});
  });
  if(!items.length){var a=parseAmount(text);if(a&&a>0)items.push({note:cleanNote(text),amt:a,cat:classify(text)});}
  return items;
}
function openMoneyQuick(){
  window.__mqItems=[];window.__mqSig='';
  var p2=panel('<div class="ph">记一笔账</div>'+
    '<textarea class="inp qt-box" id="mqTxt" placeholder="比如：早上咖啡 28，中午外卖 35，晚上和朋友吃饭 AA80" style="text-align:center;min-height:13vh"></textarea>'+
    '<div id="mqItems"><div class="money-hint">掌柜会自动拆分多笔 · 提取金额和分类</div></div>'+
    '<div class="row" style="margin:14px 0 0"><button class="btn" id="mqVoice"><svg viewBox="0 0 24 24"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/></svg>语音</button>'+
      '<span style="flex:1"></span>'+
      '<button class="btn" data-close>算了</button><button class="btn pri" id="mqAdd">存入钱袋</button></div>',true);
  p2.classList.add('big');
  setTimeout(function(){var i=$('#qtTxt')||$('#mqTxt');if(i)i.focus()},180);
  $('#mqVoice').onclick=function(){startVoice('money',function(tx){$('#mqTxt').value=tx;updateMoneyHint()})};
  $('#mqAdd').onclick=addMoneyQuick;
  $('#mqTxt').oninput=updateMoneyHint;
}
function updateMoneyHint(){
  var box=$('#mqItems');if(!box)return;
  var text=$('#mqTxt').value.trim();
  if(!text){box.innerHTML='<div class="money-hint">掌柜会自动拆分多笔 · 提取金额和分类</div>';window.__mqItems=[];window.__mqSig='';return;}
  var items=parseExpenseSentence(text);
  var sig=items.map(function(it){return it.note+'|'+it.amt}).join('~');
  if(sig===window.__mqSig)return;
  window.__mqSig=sig;window.__mqItems=items;
  if(!items.length){box.innerHTML='<div class="money-hint">掌柜没听出金额，再说一次？</div>';return;}
  var tot=items.reduce(function(s,x){return s+x.amt},0);
  box.innerHTML='<div class="money-hint" style="margin-bottom:8px">听出 <b style="color:var(--gold)">'+items.length+'</b> 笔 · 共 ¥'+num(tot)+' · 分类不对点一下就能改</div>'+
    items.map(function(it,i){
      return '<div class="mq-item"><div class="mq-n">'+esc(it.note)+'</div><div class="mq-a">¥'+num(it.amt)+'</div>'+
        '<select class="mq-c" data-i="'+i+'">'+catList().map(function(c){return '<option value="'+c.k+'"'+(c.k===it.cat?' selected':'')+'>'+esc(c.n)+'</option>'}).join('')+'</select></div>';
    }).join('');
  $$('#mqItems .mq-c').forEach(function(sel){sel.onchange=function(){window.__mqItems[+sel.dataset.i].cat=sel.value}});
}
function addMoneyQuick(){
  var items=(window.__mqItems&&window.__mqItems.length)?window.__mqItems:parseExpenseSentence(($('#mqTxt')||{value:''}).value.trim());
  if(!items.length)return toast('没听出金额，再说一次');
  var tot=0;
  items.forEach(function(it){DB.money.push({id:uid(),date:TODAY(),amt:it.amt,note:it.note,cat:it.cat});tot+=it.amt});
  save();closeModal('mMod');renderMoney();chime();
  toast('记下了 '+items.length+' 笔 · 共 ¥'+num(tot));
}
function openMoneyDetail(){
  var list=DB.money.slice().sort(function(a,c){return a.date<c.date?1:-1});
  panel('<div class="ph">账目明细</div>'+
    '<div class="mini" style="margin-bottom:12px;letter-spacing:1px">共 '+list.length+' 笔 · 点 × 可删去一笔</div>'+
    (list.length?list.map(function(e){
      var c=catOf(e.cat);
      return '<div class="item"><span class="dot" style="color:'+c.c+';background:'+c.c+'"></span><div class="c">'+
        '<div class="t">'+esc(e.note)+'</div><div class="m"><span class="tagx">'+esc(c.n)+'</span>'+cnDate(e.date)+'</div></div>'+
        '<div style="font-family:var(--serif);font-size:14px;color:var(--gold);flex:none">¥'+num(e.amt)+'</div>'+
        '<button class="x" data-mddel="'+e.id+'">×</button></div>';
    }).join(''):'<div class="empty">还没有账目</div>'));
  $$('#mModPanel [data-mddel]').forEach(function(x){x.onclick=function(){
    DB.money=DB.money.filter(function(e){return e.id!==x.dataset.mddel});save();renderMoney();openMoneyDetail()}});
}
function monthCurList(){
  var now=new Date();var cs=iso(new Date(now.getFullYear(),now.getMonth(),1));
  return DB.money.filter(function(e){return e.date>=cs});
}
function genMoneyReport(){
  var p=panel('<div class="loader"><div class="lp"></div><div class="lt">AI 正清点你的钱袋…<br>与上周较一较</div></div>');
  var m=moneyStats();var seedV=TODAY()+'m'+Math.random().toString(36).slice(2,6);
  var sys='你在为一款叫「光阴的故事」的 App 写「我的钱都去哪儿了」周度消费回顾。';
  var user='本周花用 '+m.cur+' 元，上周 '+m.prev+' 元。分类（括号内是和上周的变化）：'+m.arr.map(function(a){return a.n+' '+Math.round(a.v)+'元('+(a.v-a.pv>=0?'+':'')+Math.round(a.v-a.pv)+')'}).join('、')+'。最大一笔 '+m.max+' 元（'+m.maxNote+'）。请写 220 字左右的消费回顾：重点写和上周比的变化（哪类多了、哪类少了、为什么可能），再给一条可执行的建议。';
  var fb=function(){return MOCK.moneyBody(m)+'\n'+MOCK.moneyTip(m)};
  AI.call(sys,user,fb,moneyStyle,{report:true}).then(function(r){
    var keys=MOCK.keys({seedV:seedV,seed:seedV});
    var tj=moneyTraj(14);
    p.innerHTML='<button class="closex" data-close>×</button><div class="ticket">'+
      '<div class="tk-h"><svg class="hw" viewBox="0 0 12 34"><path d="M1 1h10v10H1z"/><path d="M4 4v4h4V4"/><path d="M1 13h10v10H1z"/><path d="M4 16v4h4v-4"/></svg>'+
      '<div class="zh">金钱当票</div><div class="en">PAWN TICKET OF COIN</div><div class="no">No.<b>'+tkNo(TODAY()+'m')+'</b></div></div>'+
      '<div class="rep">'+
      '<div style="text-align:center;font-family:var(--serif);font-size:19px;letter-spacing:2px;color:var(--gold)">铜钱如水 · 流去何方</div>'+
      '<div style="text-align:center;font-size:10.5px;color:var(--dim2);letter-spacing:1.4px;margin-bottom:14px">'+cnDate(m.ws)+' — '+cnDate(TODAY())+'</div>'+
      '<div class="big3">'+
        '<div><b>¥'+num(m.cur)+'</b><u>本周</u></div>'+
        '<div><b>¥'+num(m.prev)+'</b><u>上周</u></div>'+
        '<div><b style="color:'+(m.diff>=0?'#F0997B':'#8FD8C4')+'">'+(m.diff>=0?'+':'-')+'¥'+num(Math.abs(m.diff))+'</b><u>变化</u></div>'+
      '</div>'+
      '<div class="traj">'+trajSVG(tj.days,{gid:'mr',series:[{color:'#8FD8C4'}],max:tj.mx})+
      '<div class="tlegend"><span><i style="background:#8FD8C4"></i>近 14 天支出（元）</span></div></div>'+
      '<h4>AI 说</h4><p class="body">'+esc(r.text).replace(/\n/g,'<br>')+'</p>'+
      '<div class="quote">'+esc(randomQuote(seedV))+'</div>'+
      '<h4>本周铜钱 · 关键词</h4><div class="kw">'+keys.map(function(k){return '<span>'+k+'</span>'}).join('')+'</div>'+
      '<div class="mini" style="text-align:center;margin-top:16px">'+(r.mock?'（模拟文案 · 服务端未配置时自动回落）':'（DeepSeek 生成）')+'</div>'+
      '<canvas id="shareCv"></canvas>'+shareCard()+'</div>'+
      '<div class="tk-f"><div class="say">凭此票，兑一份清醒<i>钱未消散 · 只是化作了生活</i></div><div class="tk-seal">典进<br>不赎</div></div><div class="perf"></div></div>';
    var cv=drawCard({sub:'我的钱都去哪儿了',title:'本周金钱报告',date:cnDate(m.ws)+' — '+cnDate(TODAY()),keys:keys,
      rows:[['本周','¥'+num(m.cur)],['较上周',(m.diff>=0?'+':'-')+'¥'+num(Math.abs(m.diff))],['最大去向',m.top1]],
      traj:tj.days,trajMax:tj.mx,trajColor:'#8FD8C4',trajTitle:'近14天支出（元）',
      quote:randomQuote(seedV)});
    var sh=bindShare(cv,'金钱报告.png');
    $('#shSave').onclick=sh.save;$('#shShare').onclick=sh.share;
  });
}
function addDays(isoStr,n){
  var d=new Date(isoStr+'T00:00:00');d.setDate(d.getDate()+n);return iso(d);
}
function moneyRange(){
  var r=DB.moneyRange||{kind:'month'};
  var to=TODAY(),from;
  if(r.kind==='day')from=to;
  else if(r.kind==='week')from=rangeStart('week');
  else if(r.kind==='quarter')from=addDays(to,-89);
  else if(r.kind==='custom'&&r.from&&r.to){from=r.from;to=r.to}
  else from=iso(new Date(new Date().getFullYear(),new Date().getMonth(),1));
  if(from>to){var t0=from;from=to;to=t0}
  var days=daysBetween(from,to)+1;
  var pTo=addDays(from,-1),pFrom=addDays(pTo,-(days-1));
  var list=DB.money.filter(function(e){return e.date>=from&&e.date<=to});
  var prev=DB.money.filter(function(e){return e.date>=pFrom&&e.date<=pTo});
  var label=r.kind==='day'?'今日':r.kind==='week'?'本周':r.kind==='quarter'?'近一季度':r.kind==='custom'?(cnDate(from)+' — '+cnDate(to)):'本月';
  return {from:from,to:to,days:days,list:list,prev:prev,label:label,kind:r.kind};
}
function rangeSum(list){var s=0;list.forEach(function(e){s+=e.amt});return s}
function threeSplit(list){
  var NEC={food:1,home:1,move:1,heal:1},OPT={learn:1,peo:1,etc:1,drink:1,social:1,love:1};
  var nec=0,opt=0,unn=0,unnL=[];
  list.forEach(function(e){
    if(NEC[e.cat])nec+=e.amt;
    else if(OPT[e.cat])opt+=e.amt;
    else{unn+=e.amt;unnL.push(e)}
  });
  unnL.sort(function(a,b){return b.amt-a.amt});
  return {nec:nec,opt:opt,unn:unn,unnL:unnL};
}
function wasteList(list){
  var by={};
  list.forEach(function(e){var k=e.note;if(!by[k])by[k]={n:0,sum:0};by[k].n++;by[k].sum+=e.amt});
  return Object.keys(by).map(function(k){var o=by[k];return {note:k,n:o.n,sum:o.sum,avg:o.sum/o.n}})
    .filter(function(o){return o.n>=3&&o.avg<=120}).sort(function(a,b){return b.sum-a.sum});
}
function moneyCheckup(){
  var R=moneyRange();
  if(!R.list.length)return toast(R.label+'还没有账目，先记几笔');
  var p=panel('<div class="loader"><div class="lp"></div><div class="lt">掌柜正给你的消费做体检…</div></div>');
  var t=threeSplit(R.list);
  var tot=(t.nec+t.opt+t.unn)||1;
  var pn=Math.round(t.nec/tot*100),po=Math.round(t.opt/tot*100),pu=Math.round(t.unn/tot*100);
  var worst=t.unnL[0];
  var score;
  if(pu<=10)score='A · 优秀';else if(pu<=20)score='B · 良好';else if(pu<=45)score='C · 亚健康';else score='D · 需注意';
  var seedV=TODAY()+'ck'+Math.random().toString(36).slice(2,6);
  var sys='你是一位理性又温柔的理财顾问。用有画面感、不贩卖焦虑的语气，根据三类支出占比写 160 字左右的消费体检点评，指出哪一类最值得调整，给一条具体建议。';
  var user='统计范围：'+R.label+'，共 '+R.list.length+' 笔，合计 '+Math.round(tot)+' 元。必要支出 '+pn+'%（'+Math.round(t.nec)+'元），可优化支出 '+po+'%（'+Math.round(t.opt)+'元），非必要支出 '+pu+'%（'+Math.round(t.unn)+'元）。'+(worst?'非必要里最大一笔是「'+worst.note+'」'+Math.round(worst.amt)+' 元。':'');
  var fb=function(){
    return '这份体检单来自'+R.label+'的 '+R.list.length+' 笔账：\n'+
      '日子的地基——吃饭、住行、健康——占了 '+pn+'%，这是生活站稳的部分，不用动。\n'+
      '可优化的 '+po+'% 里藏着一些「可以更好」的选择；真正要留神的是 '+pu+'% 的非必要支出'+(worst?'，其中最扎眼的一笔是「'+worst.note+'」¥'+num(worst.amt)+'——当时是心动，回看是账单':'')+'。\n'+
      '身体是革命的本钱，账本是生活的镜子。'+ (pu<=20?'你的消费结构很健康，继续保持，偶尔犒赏自己也无可厚非。':'下个月试着给非必要支出设个上限，超过就先放进购物车晾三天。');
  };
  AI.call(sys,user,fb,moneyStyle,{report:true}).then(function(r){
    p.innerHTML='<button class="closex" data-close>×</button><div class="ticket">'+
      '<div class="tk-h"><svg class="hw" viewBox="0 0 12 34"><path d="M1 1h10v10H1z"/><path d="M4 4v4h4V4"/><path d="M1 13h10v10H1z"/><path d="M4 16v4h4v-4"/></svg>'+
      '<div class="zh">消费体检单</div><div class="en">SPENDING CHECK-UP</div><div class="no">No.<b>'+tkNo(TODAY()+'ck')+'</b></div></div>'+
      '<div class="rep">'+
      '<div style="text-align:center;font-family:var(--serif);font-size:19px;letter-spacing:2px;color:var(--gold)">个人消费体检</div>'+
      '<div style="text-align:center;font-size:10.5px;color:var(--dim2);letter-spacing:1.4px;margin:6px 0 14px">'+R.label+' · '+R.list.length+' 笔 · 共 ¥'+num(tot)+'</div>'+
      '<div class="big3">'+
        '<div><b style="color:#8FD8C4">'+pn+'%</b><u>必要支出</u></div>'+
        '<div><b style="color:#F0C882">'+po+'%</b><u>可优化</u></div>'+
        '<div><b style="color:#F0997B">'+pu+'%</b><u>非必要</u></div>'+
      '</div>'+
      '<div class="kv"><span>体检结论</span><b>'+score+'</b></div>'+
      '<h4>三类占比</h4>'+
      '<div style="margin:10px 0">'+
        '<div class="mood-bar"><span>必要</span><div class="track"><div class="fill" style="width:'+pn+'%;background:#8FD8C4"></div></div><span>¥'+num(t.nec)+'</span></div>'+
        '<div class="mood-bar"><span>可优化</span><div class="track"><div class="fill" style="width:'+po+'%;background:#F0C882"></div></div><span>¥'+num(t.opt)+'</span></div>'+
        '<div class="mood-bar"><span>非必要</span><div class="track"><div class="fill" style="width:'+pu+'%;background:#F0997B"></div></div><span>¥'+num(t.unn)+'</span></div>'+
      '</div>'+
      (worst?'<div class="kv"><span>最扎眼的一笔</span><b>「'+esc(worst.note)+'」¥'+num(worst.amt)+'</b></div>':'')+
      '<h4>掌柜说</h4><p class="body">'+esc(r.text).replace(/\n/g,'<br>')+'</p>'+
      '<div class="quote">'+esc(randomQuote(seedV))+'</div>'+
      '<div class="mini" style="text-align:center;margin-top:14px">'+(r.mock?'（模拟文案 · 服务端未配置时自动回落）':'（DeepSeek 生成）')+'</div>'+
      '<canvas id="shareCv"></canvas>'+shareCard()+'</div>'+
      '<div class="tk-f"><div class="say">身体要体检，账单也要<i>钱是日子的地基</i></div><div class="tk-seal">典进<br>不赎</div></div><div class="perf"></div></div>';
    var cv=drawCard({sub:'个人消费体检',title:R.label+'消费体检',date:cnDate(R.from)+' — '+cnDate(R.to),
      rows:[['必要支出',pn+'% · ¥'+num(t.nec)],['可优化',po+'% · ¥'+num(t.opt)],['非必要',pu+'% · ¥'+num(t.unn)]],quote:randomQuote(seedV)});
    var sh=bindShare(cv,'消费体检.png');
    $('#shSave').onclick=sh.save;$('#shShare').onclick=sh.share;
  });
}
function findWaste(){
  var R=moneyRange();
  if(!R.list.length)return toast(R.label+'还没有账目，先记几笔');
  var p=panel('<div class="loader"><div class="lp"></div><div class="lt">掌柜举着小算盘<br>一粒一粒拣那些溜走的小钱…</div></div>');
  var w=wasteList(R.list);
  var wSum=w.reduce(function(s,x){return s+x.sum},0);
  var yearEst=Math.round(wSum/Math.max(1,R.days)*365);
  var seedV=TODAY()+'ws'+Math.random().toString(36).slice(2,6);
  var sys='你是一位理性又温柔的理财顾问。用有画面感、不贩卖焦虑的语气，点评用户高频小额消费，180 字左右，核心是「小钱不堵，大洞难补」，给一条可执行的替代方案。';
  var user='统计范围：'+R.label+'（'+R.days+' 天）。高频小额支出：'+(w.length?w.slice(0,5).map(function(o){return o.note+' '+o.n+'次共'+Math.round(o.sum)+'元'}).join('、'):'没有明显的高频小额支出')+'。合计 '+Math.round(wSum)+' 元，按这个速度一年约 '+yearEst+' 元。';
  var fb=function(){
    if(!w.length)return '这一程，你没有明显的高频小额支出——每笔钱都花得有姓名、有去处。\n这份清醒，比省下多少钱都难得。继续保持。';
    return '有一种浪费，单笔小到你从不犹豫：\n'+
      w.slice(0,3).map(function(o){return '「'+o.note+'」'+o.n+' 次，共 ¥'+num(o.sum)+'，平均每次才 ¥'+num(o.avg)}).join('；')+'。\n'+
      '单独看，每一笔都理直气壮；加起来，'+R.label+'就是 ¥'+num(wSum)+'——照这个速度，一年约 ¥'+num(yearEst)+'，够一趟远方的车票。\n'+
      '不必戒掉，只需减半：把「随手买」改成「周末一次性买」，小洞堵上了，大江大河才留得住。';
  };
  AI.call(sys,user,fb,moneyStyle,{report:true}).then(function(r){
    p.innerHTML='<button class="closex" data-close>×</button><div class="ticket">'+
      '<div class="tk-h"><svg class="hw" viewBox="0 0 12 34"><path d="M1 1h10v10H1z"/><path d="M4 4v4h4V4"/><path d="M1 13h10v10H1z"/><path d="M4 16v4h4v-4"/></svg>'+
      '<div class="zh">隐形浪费单</div><div class="en">HIDDEN LEAKS</div><div class="no">No.<b>'+tkNo(TODAY()+'ws')+'</b></div></div>'+
      '<div class="rep">'+
      '<div style="text-align:center;font-family:var(--serif);font-size:19px;letter-spacing:2px;color:var(--gold)">找出隐形浪费</div>'+
      '<div style="text-align:center;font-size:10.5px;color:var(--dim2);letter-spacing:1.4px;margin:6px 0 14px">'+R.label+' · 高频小额 · 积少成多</div>'+
      '<div class="big3">'+
        '<div><b>¥'+num(wSum)+'</b><u>'+R.label+'小额累计</u></div>'+
        '<div><b>'+w.length+'</b><u>类高频支出</u></div>'+
        '<div><b style="color:#F0997B">¥'+num(yearEst)+'</b><u>照此一年约</u></div>'+
      '</div>'+
      (w.length?
        '<h4>溜走的小钱 · 一笔一笔</h4>'+
        w.slice(0,6).map(function(o){
          return '<div class="kv"><span>'+esc(o.note)+' <u style="text-decoration:none;color:var(--dim2);font-size:10px">'+o.n+'次 · 均¥'+num(o.avg)+'</u></span><b>¥'+num(o.sum)+'</b></div>';
        }).join('')
        :'<div class="empty" style="margin:10px 0">'+R.label+'没有明显的高频小额支出，很干净</div>')+
      '<h4>掌柜说</h4><p class="body">'+esc(r.text).replace(/\n/g,'<br>')+'</p>'+
      '<div class="quote">'+esc(randomQuote(seedV))+'</div>'+
      '<div class="mini" style="text-align:center;margin-top:14px">'+(r.mock?'（模拟文案 · 服务端未配置时自动回落）':'（DeepSeek 生成）')+'</div>'+
      '<canvas id="shareCv"></canvas>'+shareCard()+'</div>'+
      '<div class="tk-f"><div class="say">小钱不堵，大洞难补<i>粒米成箩 · 滴水成河</i></div><div class="tk-seal">典进<br>不赎</div></div><div class="perf"></div></div>';
    var cv=drawCard({sub:'找出隐形浪费',title:R.label+'隐形浪费',date:cnDate(R.from)+' — '+cnDate(R.to),
      rows:[['小额累计','¥'+num(wSum)],['高频类别',w.length+' 类'],['一年约','¥'+num(yearEst)]],quote:randomQuote(seedV)});
    var sh=bindShare(cv,'隐形浪费.png');
    $('#shSave').onclick=sh.save;$('#shShare').onclick=sh.share;
  });
}
function timeRange(){
  var r=DB.timeRange||{kind:'week'};
  var to=TODAY(),from;
  if(r.kind==='day')from=to;
  else if(r.kind==='week')from=rangeStart('week');
  else if(r.kind==='month')from=iso(new Date(new Date().getFullYear(),new Date().getMonth(),1));
  else if(r.kind==='quarter')from=addDays(to,-89);
  else if(r.kind==='custom'&&r.from&&r.to){from=r.from;to=r.to}
  else from=rangeStart('week');
  if(from>to){var t0=from;from=to;to=t0}
  var days=daysBetween(from,to)+1;
  var pTo=addDays(from,-1),pFrom=addDays(pTo,-(days-1));
  var list=DB.time.filter(function(e){return e.date>=from&&e.date<=to});
  var prev=DB.time.filter(function(e){return e.date>=pFrom&&e.date<=pTo});
  var label=r.kind==='day'?'今日':r.kind==='week'?'本周':r.kind==='month'?'本月':r.kind==='quarter'?'本季度':(cnDate(from)+' — '+cnDate(to));
  return {from:from,to:to,days:days,list:list,prev:prev,label:label,kind:r.kind};
}
function moodRange(){
  var r=DB.moodRangeSel||{kind:'month'};
  var to=TODAY(),from;
  if(r.kind==='day')from=to;
  else if(r.kind==='week')from=rangeStart('week');
  else if(r.kind==='month')from=iso(new Date(new Date().getFullYear(),new Date().getMonth(),1));
  else if(r.kind==='quarter')from=addDays(to,-89);
  else if(r.kind==='custom'&&r.from&&r.to){from=r.from;to=r.to}
  else from=iso(new Date(new Date().getFullYear(),new Date().getMonth(),1));
  if(from>to){var t0=from;from=to;to=t0}
  var days=daysBetween(from,to)+1;
  var list=DB.mood.filter(function(e){return e.date>=from&&e.date<=to});
  var label=r.kind==='day'?'今日':r.kind==='week'?'本周':r.kind==='month'?'本月':r.kind==='quarter'?'本季度':(cnDate(from)+' — '+cnDate(to));
  return {from:from,to:to,days:days,list:list,label:label,kind:r.kind};
}
function payGlow(kind,label){
  var colors={
    love: {a:'#F2A9BC',b:'#FFD0DC',c:'rgba(242,169,188,.35)',grain:22,emoji:'❤'},
    coin: {a:'#F0D394',b:'#FFE8B0',c:'rgba(240,211,148,.35)',grain:24,emoji:'✦'},
    first:{a:'#9BA8F0',b:'#C8CFFF',c:'rgba(155,168,240,.35)',grain:26,emoji:'★'},
    month:{a:'#F0D394',b:'#F0997B',c:'rgba(240,153,123,.3)',grain:30,emoji:'✺'}
  };
  var K=colors[kind]||colors.coin;
  var root=document.createElement('div');
  root.className='pay-glow';
  var parts='';
  for(var i=0;i<K.grain;i++){
    var ang=Math.random()*360;
    var dist=80+Math.random()*260;
    var size=2+Math.random()*5;
    var delay=Math.random()*0.5;
    parts+='<i class="pg-p" style="--a:'+K.a+';--d:'+dist+'px;--ang:'+ang+'deg;--s:'+size+'px;--del:'+delay+'s"></i>';
  }
  root.innerHTML=
    '<div class="pg-ring" style="--a:'+K.a+';--b:'+K.b+';--c:'+K.c+'"></div>'+
    '<div class="pg-burst" style="--a:'+K.a+';--b:'+K.b+'"></div>'+
    '<div class="pg-label" style="--a:'+K.a+'">'+esc(label||(K.emoji+' '+kind))+'</div>'+
    parts;
  document.body.appendChild(root);
  setTimeout(function(){root.classList.add('out')}, 1900);
  setTimeout(function(){root.remove()}, 2500);
}
function paywallOpen(){
  if(DB.paywallDismissed)return;
  DB.vip=DB.vip||{plan:'trial',until:'',love:false,credits:0};
  var trialLeft=Math.max(0,7-daysBetween(DB.created,TODAY()));
  var isMonth=DB.vip.plan==='month';
  panel('<div class="ph">光阴的定价</div>'+
    '<div class="pd">'+(isMonth?'当前已是月度会员':'新用户免费体验 7 天，所有功能都能用')+' · '+(isMonth?'到期 '+cnDate(DB.vip.until):'还剩 '+trialLeft+' 天')+'</div>'+
    '<div class="box" style="border:1px solid rgba(240,211,148,.4);padding:14px;margin-bottom:10px;background:linear-gradient(168deg,rgba(240,211,148,.06),rgba(155,168,240,.04))">'+
      '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><b style="font-family:var(--serif);color:var(--gold);font-size:15px">首月尝鲜</b><b style="font-family:var(--serif);color:var(--gold);font-size:13px;flex:none">3.99 光阴币</b></div>'+
      '<div class="mini" style="margin:6px 0 10px;line-height:1.9;color:var(--ink)">不到一杯奶茶的价格，看看你的光阴去了哪里 · 记账板块高级数据分析 + 其他三个模块记录功能</div>'+
      '<button class="btn pri" id="pwFirst" style="width:100%">开通首月会员（模拟）</button></div>'+
    '<div class="box" style="border:1px solid var(--line2);padding:14px;margin-bottom:10px">'+
      '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><b style="font-family:var(--serif);color:var(--gold);font-size:14px">月度会员</b><b style="font-family:var(--serif);color:var(--gold);font-size:12px;flex:none">9.99 光阴币 / 月</b></div>'+
      '<div class="mini" style="margin:6px 0 10px;line-height:1.9">让光阴陪你走得更远 · 同等权益</div>'+
      '<button class="btn" id="pwMonth" style="width:100%">续费月度会员（模拟）</button></div>'+
    '<div class="box" style="border:1px solid var(--line2);padding:14px;margin-bottom:10px">'+
      '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><b style="font-family:var(--serif);color:var(--gold);font-size:14px">按次报告</b><b style="font-family:var(--serif);color:var(--gold);font-size:12px;flex:none">2.33 光阴币 / 次</b></div>'+
      '<div class="mini" style="margin:6px 0 10px;line-height:1.9">记录每一次心动的瞬间 · 任意模块一份 AI 完整报告</div>'+
      '<button class="btn" id="pwOnce" style="width:100%">购买一次（模拟）</button></div>'+
    '<div class="row" style="margin-top:6px"><button class="btn sm" id="pwLater" style="flex:1">稍后再说</button>'+
      '<button class="btn sm" id="pwMore" style="flex:1">更多付费说明</button></div>');
  $('#pwFirst').onclick=function(){DB.vip.plan='month';DB.vip.until=addDays(TODAY(),30);DB.vip.firstMonth=true;save();payGlow('first','首月尝鲜 3.99');closeModal('mMod');toast('不到一杯奶茶的价格 · 首月会员已开启（模拟）')};
  $('#pwMonth').onclick=function(){DB.vip.plan='month';DB.vip.until=addDays(TODAY(),30);save();payGlow('month','月度会员 9.99');closeModal('mMod');toast('让光阴陪你走得更远 · 月度会员已续（模拟）')};
  $('#pwOnce').onclick=function(){DB.vip.credits=(DB.vip.credits||0)+1;save();payGlow('coin','2.33 光阴币');closeModal('mMod');toast('记录每一次心动的瞬间 · 1 次报告机会已存入（模拟）')};
  $('#pwLater').onclick=function(){DB.paywallDismissed=true;save();closeModal('mMod')};
  $('#pwMore').onclick=function(){closeModal('mMod');openSet()};
}
function boxInsight(){
  var v=$('#bxDate')?$('#bxDate').value:TODAY();
  var win=addDays(v,-3),win2=addDays(v,3);
  function inWin(d){return d>=win&&d<=win2}
  var tE=DB.time.filter(function(e){return inWin(e.date)});
  var mE=DB.money.filter(function(e){return inWin(e.date)});
  var mdE=DB.mood.filter(function(e){return inWin(e.date)});
  var drE=DB.dream.ideas.filter(function(e){return inWin(e.date)});
  var spent=mE.reduce(function(s,x){return s+x.amt},0);
  var hours=0;tE.forEach(function(e){(e.actual||[]).forEach(function(a){hours+=parseFloat(a.min)||0})});
  var tH=(hours/60).toFixed(1);
  var pN=tE.reduce(function(s,x){return s+(x.plan||[]).length},0);
  var aN=tE.reduce(function(s,x){return s+(x.actual||[]).length},0);
  var moodCounts={};mdE.forEach(function(e){var k=e.mood||'未分类';moodCounts[k]=(moodCounts[k]||0)+1});
  var topMood=Object.keys(moodCounts).sort(function(a,b){return moodCounts[b]-moodCounts[a]})[0]||'未留痕';
  var empty=tE.length===0&&mE.length===0&&mdE.length===0&&drE.length===0;
  var seedV=v+'bi'+Math.random().toString(36).slice(2,6);
  var sys='你是一位温柔的叙事者。把用户回到某一天的前后三天里——时间、金钱、心情、梦想四个维度的轨迹——凝成一段 220 字左右、有画面感、不鸡汤的「综合洞见」。要点：四个维度都要点到，但讲成一个故事；指出那时的小线索在今天的意义。';
  var user='回到 '+cnDate(v)+' 的前后三天（共 7 天）：花了 '+Math.round(spent)+' 元（'+mE.length+' 笔），记了 '+tH+' 小时的实际（计划 '+pN+' 件 / 实际 '+aN+' 件），情绪分布：'+(Object.keys(moodCounts).length?Object.keys(moodCounts).map(function(k){return k+' '+moodCounts[k]+'次'}).join('、'):'无')+'（最常是「'+topMood+'」），共记录了 '+mdE.length+' 条心情、'+drE.length+' 条想法。这些，是那时的光阴。';
  var fb=function(){
    if(empty)return '回到 '+cnDate(v)+' 的前后三天，你的光阴在四个模块里都未留痕——那一天，你只活在自己心里，没留下证据。\n但这本身就是一种珍贵：不被测量的日子，才最像自己。\n愿你往后的每一个平常日子，都能在某个角落，给自己留下一行。';
    return '回到 '+cnDate(v)+' 的前后三天，你的光阴是这样过的：'+tH+' 小时撒在日子里，'+Math.round(spent)+' 元铜钱换来了具体的生活，'+mdE.length+' 条心情，'+drE.length+' 条痴想。\n'+
      '最常光顾你心头的，是「'+topMood+'」——那一阵风，吹过饭桌、通勤和深夜，吹进了你后来写下的一些字。\n'+
      '那时的你大概不会想到：今天你正在为「光阴里的我们」搭一座小店。\n'+
      '但事后看，'+(spent>300?'那阵花钱的「手松」，后来被记账这件事慢慢收紧了。':'')+' '+(mdE.length>5?'那些存进树洞的坏情绪，是你后来学会和自己和解的证据。':'')+' '+(drE.length>0?'那时脑子里的痴想，有些已经兑现，有些还搁在原地，等你回望。':'')+'\n'+
      '光阴就是这样——当时只道是寻常，回头看，每一笔都有来处。';
  };
  var p=panel('<div class="loader"><div class="lp"></div><div class="lt">掌柜正翻开宝盒<br>为你串起这一段光阴的脉络…</div></div>');
  AI.call(sys,user,fb,'lyric',{report:true}).then(function(r){
    p.innerHTML='<button class="closex" data-close>×</button><div class="ticket">'+
      '<div class="tk-h"><svg class="hw" viewBox="0 0 12 34"><path d="M1 1h10v10H1z"/><path d="M4 4v4h4V4"/><path d="M1 13h10v10H1z"/><path d="M4 16v4h4v-4"/></svg>'+
      '<div class="zh">综合洞见</div><div class="en">CROSS-INSIGHT</div><div class="no">No.<b>'+tkNo(seedV)+'</b></div></div>'+
      '<div class="rep">'+
      '<div style="text-align:center;font-family:var(--serif);font-size:19px;letter-spacing:2px;color:var(--gold)">穿越 '+cnDate(v)+'</div>'+
      '<div style="text-align:center;font-size:10.5px;color:var(--dim2);letter-spacing:1.4px;margin:6px 0 14px">时间 · 铜钱 · 心绪 · 痴想 · 一段光阴的横截面</div>'+
      '<div class="big3">'+
        '<div><b>'+tH+'h</b><u>那段时间</u></div>'+
        '<div><b>¥'+num(spent)+'</b><u>那些铜钱</u></div>'+
        '<div><b>'+mdE.length+'</b><u>那些心情</u></div>'+
      '</div>'+
      '<div class="kv"><span>最常光顾的情绪</span><b>'+esc(topMood)+'</b></div>'+
      '<div class="kv"><span>那时脑子里的痴想</span><b>'+drE.length+' 条</b></div>'+
      '<div class="kv"><span>时间门类</span><b>计划 '+pN+' / 实际 '+aN+' 件</b></div>'+
      '<h4>掌柜的洞见</h4><p class="body">'+esc(r.text).replace(/\n/g,'<br>')+'</p>'+
      '<div class="quote">'+esc(randomQuote(seedV))+'</div>'+
      '<div class="mini" style="text-align:center;margin-top:14px">'+(r.mock?'（模拟文案 · 服务端未配置时自动回落）':'（DeepSeek 生成）')+'</div>'+
      '<canvas id="shareCv"></canvas>'+shareCard()+'</div>'+
      '<div class="tk-f"><div class="say">当时只道是寻常<i>回头看 · 每一笔都有来处</i></div><div class="tk-seal">典进<br>不赎</div></div><div class="perf"></div></div>';
    var cv=drawCard({sub:'综合洞见',title:'穿越 '+cnDate(v),date:cnDate(v),
      rows:[['那段时间',tH+'h'],['那些铜钱','¥'+num(spent)],['那些心情',mdE.length+'条']],quote:randomQuote(seedV)});
    var sh=bindShare(cv,'综合洞见.png');
    $('#shSave').onclick=sh.save;$('#shShare').onclick=sh.share;
  });
}
function moneyStatement(){
  var R=moneyRange();
  if(!R.list.length)return toast(R.label+'还没有账目，先记几笔');
  var p=panel('<div class="loader"><div class="lp"></div><div class="lt">掌柜正铺开账本<br>为你出一份铜钱对账单…</div></div>');
  var t=threeSplit(R.list);
  var tot=(t.nec+t.opt+t.unn)||1;
  var pn=Math.round(t.nec/tot*100),po=Math.round(t.opt/tot*100),pu=Math.round(t.unn/tot*100);
  var worst=t.unnL[0];
  var cur=Math.round(rangeSum(R.list)),prev=Math.round(rangeSum(R.prev));
  var diff=cur-prev;
  var cBy={},pBy={};
  R.list.forEach(function(e){cBy[e.cat]=(cBy[e.cat]||0)+e.amt});
  R.prev.forEach(function(e){pBy[e.cat]=(pBy[e.cat]||0)+e.amt});
  var overCat=null;
  Object.keys(cBy).forEach(function(k){var dd=cBy[k]-(pBy[k]||0);if(dd>0&&(!overCat||dd>overCat.d))overCat={k:k,d:dd,v:cBy[k]}});
  var w=wasteList(R.list);
  var wSum=w.reduce(function(sm,x){return sm+x.sum},0);
  var saveNext=Math.round(wSum+t.unn*0.5);
  var seedV=TODAY()+'st'+Math.random().toString(36).slice(2,6);
  var sys='你是一位理性又温柔的理财顾问。用有画面感、不贩卖焦虑的语气，根据用户的同期对比、三类支出占比、超支分类、最没必要的一笔、高频小额浪费，写一份 200 字左右的消费对账单点评。核心落在「怎么合理规划下一期的支出」，给两条具体可执行的建议。';
  var user='范围：'+R.label+'（'+R.days+' 天），本期花 '+cur+' 元，上一期 '+prev+' 元（'+(diff>=0?'多':'少')+'花了 '+Math.abs(diff)+' 元）。三类：必要 '+pn+'%，可优化 '+po+'%，非必要 '+pu+'%（约 '+Math.round(t.unn)+' 元）。'+(overCat?'涨得最多的分类是「'+catOf(overCat.k).n+'」，比上一期多花 '+Math.round(overCat.d)+' 元。':'')+(worst?'非必要里最大的一笔是「'+worst.note+'」'+Math.round(worst.amt)+' 元。':'')+(wSum>0?'高频小额浪费共 '+Math.round(wSum)+' 元（'+w.slice(0,3).map(function(o){return o.note+o.n+'次'}).join('、')+'）。':'')+'按砍掉隐形浪费+非必要减半估算，下一期可省 '+saveNext+' 元。';
  var fb=function(){
    return '这一段日子（'+R.label+'），你花出了 '+cur+' 元，比上一期'+(diff>=0?'多':'少')+'了 '+Math.abs(diff)+' 元——'+(diff>0?'多出来的部分，大多有名字，只是未必都有必要。':'能少花，是你对自己说到做到。')+'\n'+
      '日子的地基（吃饭住行健康）占了 '+pn+'%，稳稳的；真正要留神的是那 '+pu+'% 的非必要'+(worst?'，最扎眼的一笔是「'+worst.note+'」¥'+num(worst.amt)+'——当时是心动，回看是账单':'')+'。\n'+
      (wSum>0?'还有那些一杯一笔的小钱：'+w.slice(0,2).map(function(o){return '「'+o.note+'」'+o.n+' 次共 ¥'+num(o.sum)}).join('，')+'。单独看都不疼，加起来就是 ¥'+num(wSum)+'。\n':'')+
      '下一期，试试两条小规矩：非必要先放购物车晾三天；每周留一天「零花费日」。照这样做，账面上大约能多出 ¥'+num(saveNext)+'——够一场演出，或一趟说走就走的短途。\n'+
      '钱不是省出来的，是换出来的。愿你换成的，都是真正想要的生活。';
  };
  AI.call(sys,user,fb,moneyStyle,{report:true}).then(function(r){
    p.innerHTML='<button class="closex" data-close>×</button><div class="ticket">'+
      '<div class="tk-h"><svg class="hw" viewBox="0 0 12 34"><path d="M1 1h10v10H1z"/><path d="M4 4v4h4V4"/><path d="M1 13h10v10H1z"/><path d="M4 16v4h4v-4"/></svg>'+
      '<div class="zh">铜钱对账</div><div class="en">STATEMENT OF COIN</div><div class="no">No.<b>'+tkNo(TODAY()+'st')+'</b></div></div>'+
      '<div class="rep">'+
      '<div style="text-align:center;font-family:var(--serif);font-size:19px;letter-spacing:2px;color:var(--gold)">铜钱对账 · 金钱篇</div>'+
      '<div style="text-align:center;font-size:10.5px;color:var(--dim2);letter-spacing:1.4px;margin:6px 0 14px">'+R.label+' · 体检 + 隐形浪费 · 一次看清</div>'+
      '<div class="big3">'+
        '<div><b>¥'+num(cur)+'</b><u>本期花用</u></div>'+
        '<div><b style="color:'+(diff>0?'#F0997B':'#8FD8C4')+'">'+(diff>=0?'+':'-')+'¥'+num(Math.abs(diff))+'</b><u>比上一期</u></div>'+
        '<div><b style="color:#8FD8C4">¥'+num(saveNext)+'</b><u>下期可省</u></div>'+
      '</div>'+
      '<div class="mblock"><div class="mh"><i class="mno">①</i>个人消费体检</div>'+
      '<div class="kv"><span>本期比上一期</span><b style="color:'+(diff>0?'#F0997B':'#8FD8C4')+'">'+(diff>0?'多花了 ¥'+num(diff):diff<0?'少花了 ¥'+num(-diff):'持平')+'</b></div>'+
      '<div class="kv"><span>最没必要的一笔</span><b>'+(worst?'「'+esc(worst.note)+'」¥'+num(worst.amt):'这一期都很必要')+'</b></div>'+
      '<div style="margin:10px 0">'+
        '<div class="mood-bar"><span>必要</span><div class="track"><div class="fill" style="width:'+pn+'%;background:#8FD8C4"></div></div><span>¥'+num(t.nec)+'</span></div>'+
        '<div class="mood-bar"><span>可优化</span><div class="track"><div class="fill" style="width:'+po+'%;background:#F0C882"></div></div><span>¥'+num(t.opt)+'</span></div>'+
        '<div class="mood-bar"><span>非必要</span><div class="track"><div class="fill" style="width:'+pu+'%;background:#F0997B"></div></div><span>¥'+num(t.unn)+'</span></div>'+
      '</div></div>'+
      (w.length?
        '<div class="mblock"><div class="mh"><i class="mno">②</i>隐形浪费 · 高频小额</div><div style="margin-bottom:6px">'+w.slice(0,4).map(function(o){
          return '<div class="kv"><span>'+esc(o.note)+' <u style="text-decoration:none;color:var(--dim2);font-size:10px">'+o.n+'次 · 均¥'+num(o.avg)+'</u></span><b>¥'+num(o.sum)+' <u style="text-decoration:none;color:#F0997B;font-size:10px">年≈'+num(Math.round(o.sum/Math.max(1,R.days)*365))+'</u></b></div>';
        }).join('')+'</div></div>'
        :
        '<div class="mblock"><div class="mh"><i class="mno">②</i>隐形浪费 · 高频小额</div><div class="mini" style="text-align:center;color:var(--dim2)">这一段日子没有高频小额浪费，干得漂亮</div></div>')+
      '<div class="mblock"><div class="mh"><i class="mno">③</i>对比上期 · 下期规划</div>'+
      '<div class="kv"><span>花超了的分类</span><b>'+(overCat?'「'+esc(catOf(overCat.k).n)+'」本期 ¥'+num(overCat.v)+' · 比上期 +¥'+num(overCat.d):'没有明显超支分类')+'</b></div>'+
      '<div class="kv"><span>下一期可以省</span><b style="color:#8FD8C4">¥'+num(saveNext)+'</b></div>'+
      '<h4>掌柜的理财建议</h4><p class="body">'+esc(r.text).replace(/\n/g,'<br>')+'</p>'+
      '</div>'+
      '<div class="quote">'+esc(randomQuote(seedV))+'</div>'+
      '<div class="mini" style="text-align:center;margin-top:14px">'+(r.mock?'（模拟文案 · 服务端未配置时自动回落）':'（DeepSeek 生成）')+'</div>'+
      '<canvas id="shareCv"></canvas>'+shareCard()+'</div>'+
      '<div class="tk-f"><div class="say">花得明白，才过得踏实<i>钱未消散 · 只是化作了生活</i></div><div class="tk-seal">典进<br>不赎</div></div><div class="perf"></div></div>';
      var cv=drawCard({sub:'铜钱对账',title:R.label+'消费对账',date:cnDate(R.from)+' — '+cnDate(R.to),
      rows:[['本期花用','¥'+num(cur)],['比上一期',(diff>=0?'+':'-')+'¥'+num(Math.abs(diff))],['下期可省','¥'+num(saveNext)]],quote:randomQuote(seedV)});
    var sh=bindShare(cv,'光阴对账单.png');
    $('#shSave').onclick=sh.save;$('#shShare').onclick=sh.share;
  });
}
function genMoodReport(){
  var p=panel('<div class="loader"><div class="lp"></div><div class="lt">树洞正在翻阅你的年轮…</div></div>');
  var MR=moodRange();
  var list=MR.list;
  var seedV=TODAY()+'mo'+Math.random().toString(36).slice(2,6);
  var counts={}; var total=list.length; var first='—', last='—';
  if(total){
    var oldest=list.reduce(function(a,b){return a.date<b.date?a:b});
    var newest=list.reduce(function(a,b){return a.date>b.date?a:b});
    first=cnDate(oldest.date); last=cnDate(newest.date);
  }
  list.forEach(function(e){var k=e.mood||'未分类'; counts[k]=(counts[k]||0)+1;});
  var topArr=Object.keys(counts).sort(function(a,b){return counts[b]-counts[a]});
  var topMood=topArr[0]||'未分类';
  var streak=0,maxStreak=0;
  var seen=TODAY();for(var i=0;i<MR.days+5;i++){var d=addDays(seen,-i);var dn=list.some(function(e){return e.date===d});if(dn){streak++;maxStreak=Math.max(maxStreak,streak)}else{streak=0}};
  var sys='你是网易云/飞书年度账单风格的文案写手。用温暖、有画面感、克制不鸡汤的语气，把用户的心情记录写成一段 180 字左右的「心情年轮」年度回顾。要出现记录数、最常情绪、连续记录天数等数据感，最后一句诗意收尾。';
  var user='我共记录了 '+total+' 条心情，最常出现的情绪是「'+topMood+'」，最近连续记录 '+maxStreak+' 天。情绪分布：'+Object.keys(counts).map(function(k){return k+' '+counts[k]+'次'}).join('、')+'。';
  var fb=function(){
    return '这一年，你把 '+total+' 个瞬间存进了树洞——有的是晴天，有的是阴天，树洞都替你收好了。\n'+
      '「'+topMood+'」来了 '+counts[topMood]+' 次，像一阵最常路过的风。\n'+
      '你曾连续 '+maxStreak+' 天和树洞见面，那是一段被认真度过的日子，每一天都有回音。\n'+
      '情绪没有好坏，它们都是光阴的纹理。愿往后的日子，心事有人听，落日有人陪。';
  };
  AI.call(sys,user,fb,'lyric',{report:true}).then(function(r){
    var sortedKeys=Object.keys(counts).sort(function(a,b){return counts[b]-counts[a]});
    p.innerHTML='<button class="closex" data-close>×</button><div class="ticket">'+
      '<div class="tk-h"><svg class="hw" viewBox="0 0 12 34"><path d="M1 1h10v10H1z"/><path d="M4 4v4h4V4"/><path d="M1 13h10v10H1z"/><path d="M4 16v4h4v-4"/></svg>'+
      '<div class="zh">心情树洞</div><div class="en">RINGS OF MOOD</div><div class="no">No.<b>'+tkNo(TODAY()+'mo')+'</b></div></div>'+
      '<div class="rep">'+
      '<div style="text-align:center;font-family:var(--serif);font-size:19px;letter-spacing:2px;color:var(--gold)">你的心情年轮</div>'+
      '<div style="text-align:center;font-size:10.5px;color:var(--dim2);letter-spacing:1.4px;margin-bottom:14px">'+first+' — '+last+'</div>'+
      '<div class="big3">'+
        '<div><b>'+total+'</b><u>记录</u></div>'+
        '<div><b>'+esc(topMood)+'</b><u>最常情绪</u></div>'+
        '<div><b>'+maxStreak+'</b><u>连续天数</u></div>'+
      '</div>'+
      '<div style="margin:14px 0">'+sortedKeys.map(function(k){
        var c=moodColor(k); var pct=Math.round(counts[k]/total*100);
        return '<div class="mood-bar"><span>'+esc(k)+'</span><div class="track"><div class="fill" style="width:'+pct+'%;background:'+c+'"></div></div><span>'+counts[k]+'</span></div>';
      }).join('')+'</div>'+
      '<h4>树洞说</h4><p class="body">'+esc(r.text).replace(/\n/g,'<br>')+'</p>'+
      '<div class="quote">'+esc(randomQuote(seedV))+'</div>'+
      '<canvas id="shareCv"></canvas>'+shareCard()+'</div>'+
      '<div class="tk-f"><div class="say">把情绪种成树<i>年轮里藏着所有的天气</i></div><div class="tk-seal">典进<br>不赎</div></div><div class="perf"></div></div>';
    var rows=sortedKeys.slice(0,3).map(function(k){return [esc(k),counts[k]+'次']});
    var cv=drawCard({sub:'心情树洞',title:'我的心情年报',date:first+' — '+last,
      rows:rows,quote:randomQuote(seedV)});
    var sh=bindShare(cv,'心情年报.png');
    $('#shSave').onclick=sh.save;$('#shShare').onclick=sh.share;
  });
}

/* ============================================================
   ③ 心情树洞（自定义心情标签）
   ============================================================ */
var moodPick='';
function renderMood(){
  var b=$('#bMood');
  var list=DB.mood.slice().sort(function(a,c){return a.date<c.date?1:-1});
  var count=list.length;
  var grid='';
  moodDays(30).forEach(function(o){
    var c=o.e.length?moodColor(o.e[0].mood||''):'';
    grid+='<i title="'+o.date+(o.e.length?' '+o.e[0].text.slice(0,10):'')+'" style="'+(o.e.length?'background:'+c+';box-shadow:0 0 9px '+c+';border-color:'+c:'')+'"></i>';
  });
  var legend=moodCatList().map(function(m){return '<span style="color:'+m.c+'">■</span>'+m.k}).join(' ')+' <span style="color:#BFA3E8">■</span>未分类';
  b.innerHTML=
  '<div class="mood-quick">'+
    (count===0?'<div class="mood-quick-hint">树洞还空空的</div><div class="mood-quick-hint" style="margin-top:2px;margin-bottom:4px">好的坏的都丢进来，树洞替你收好每一次</div>':'<div class="mood-quick-hint">好的坏的都丢进来，树洞替你收好每一次</div>')+
    '<textarea class="inp qt-box" id="mdTxt" placeholder="想到什么写什么，不必斟酌字句"></textarea>'+
    '<div class="chips" style="margin-top:12px" id="mdMood">'+
      moodCatList().map(function(m){return '<button class="chip'+(moodPick===m.k?' on':'')+'" data-m="'+esc(m.k)+'">'+esc(m.k)+'</button>'}).join('')+
      '<button class="chip'+(moodPick===''?' on':'')+'" data-m="">不分类</button></div>'+
    '<div class="row" style="margin-top:14px;width:100%;max-width:380px">'+
      '<button class="btn" id="mdVoice"><svg viewBox="0 0 24 24"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/></svg>说出来</button>'+
      '<button class="btn" id="mdPhoto"><svg viewBox="0 0 24 24"><path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.2l1.1-2h8.4l1.1 2h2.2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z"/><circle cx="12" cy="13" r="3.2"/></svg>拍张照</button>'+
      '<button class="btn pri" id="mdAdd">存进树洞</button></div>'+
    '<div id="mdPrev" style="margin-top:10px"></div>'+
  '</div>'+

  '<div class="sec"><div class="sec-t">心情标签 · 自创自改<span class="r">喜怒哀乐不够 · 便自己造</span></div>'+
    '<div class="box">'+moodCatList().map(function(m,i){
      return '<div class="item"><span class="dot" style="color:'+m.c+';background:'+m.c+'"></span><div class="c">'+
        (i<DEF_MOODS.length?'<div class="t">'+esc(m.k)+'</div>':'<input class="inp" data-mcat="'+esc(m.k)+'" value="'+esc(m.k)+'" style="padding:6px 9px;font-size:12px;background:transparent;border:none">')+
        '</div>'+(i>=DEF_MOODS.length?'<button class="x" data-mdelcat="'+esc(m.k)+'">×</button>':'')+'</div>';
    }).join('')+
    '<div class="row" style="margin-top:10px"><input class="inp" id="newMCat" placeholder="造一种心情，如：上头 / 麻了 / 平静" style="flex:1"><button class="btn sm" id="addMCat">加</button></div>'+
    '<div class="mini" style="margin-top:8px">自带心情不可删；自定义的，可改名删去，<br>旧日记录亦随之而改。</div>'+
    '</div></div>'+

  '<div class="sec"><div class="sec-t">近三十日 · 心情树洞</div>'+
    '<div class="box"><div class="dots">'+grid+'</div>'+
    '<div class="mini" style="margin-top:10px;text-align:center">'+legend+'</div></div></div>'+

  '<div class="sec"><div class="sec-t">心情年报<span class="r">网易云/飞书风</span></div>'+
    '<div class="box">'+
      '<div class="chips" id="mdRange" style="margin-bottom:10px">'+
        [['day','今天'],['week','本周'],['month','本月'],['quarter','季度'],['custom','自选']].map(function(x){
          var on=(DB.moodRangeSel&&DB.moodRangeSel.kind===x[0])||(!DB.moodRangeSel&&x[0]==='month');
          return '<button class="chip'+(on?' on':'')+'" data-r="'+x[0]+'">'+x[1]+'</button>'}).join('')+
      '</div>'+
      ((DB.moodRangeSel&&DB.moodRangeSel.kind==='custom')?
        '<div class="row" style="gap:8px;margin-bottom:10px">'+
          '<input class="inp" type="date" id="mdRFrom" value="'+(DB.moodRangeSel.from||TODAY())+'" style="flex:1">'+
          '<input class="inp" type="date" id="mdRTo" value="'+(DB.moodRangeSel.to||TODAY())+'" style="flex:1"></div>':'')+
      '<div class="mini" style="margin-bottom:10px;color:var(--dim2)">当前范围：'+moodRange().label+' · '+moodRange().list.length+' 条心情</div>'+
      '<button class="btn pri" id="mdReport" style="width:100%">生成'+moodRange().label+'心情报告</button></div></div>'+

  '<div class="sec"><div class="sec-t">树洞回声<span class="r">共 '+list.length+' 条</span></div>'+
    (list.length?'':'<div class="box"><div class="empty">树洞空空<br>它不催你，只等你</div></div>')+
    list.slice(0,(DB.__ui&&DB.__ui.mood)?list.length:3).map(function(e){
      var c=moodColor(e.mood||'');
      var echo=DB.echo[e.id];
      return '<div class="box" style="margin-bottom:11px">'+
        '<div class="item"><span class="dot" style="color:'+c+';background:'+c+'"></span><div class="c">'+
        '<div class="t">'+esc(e.text)+'</div><div class="m">'+cnDate(e.date)+(e.mood?' · '+esc(e.mood):'')+'</div></div>'+
        '<button class="x" data-del="'+e.id+'">×</button></div>'+
        (e.photo?'<div class="photos"><img src="'+e.photo+'" alt=""></div>':'')+
        (echo?'<div class="quote" style="margin:10px 0 0">树洞回声：'+esc(echo)+'</div>':
          '<button class="btn sm" style="margin-top:10px" data-echo="'+e.id+'">让 AI 回应一句</button>')+
        '</div>';
    }).join('')+(list.length>3?'<button class="btn" id="mEchoMore" style="width:100%;margin-top:10px">'+(DB.__ui&&DB.__ui.mood?'收起心情':'展开更多心情')+'</button>':'')+
  '</div>';

  $$('#mdMood .chip').forEach(function(c){c.onclick=function(){
    var keep=$('#mdTxt')?$('#mdTxt').value:'';
    var prev=$('#mdPrev')?$('#mdPrev').innerHTML:'';
    moodPick=c.dataset.m;renderMood();
    if($('#mdTxt'))$('#mdTxt').value=keep; if(prev && $('#mdPrev'))$('#mdPrev').innerHTML=prev;}});
  $('#mdVoice').onclick=function(){startVoice('mood',function(tx){$('#mdTxt').value=tx})};
  $('#mdPhoto').onclick=function(){pickPhoto(function(d){window.__ph=d;$('#mdPrev').innerHTML='<img src="'+d+'" style="width:70px;height:70px;object-fit:cover;border-radius:9px;border:1px solid var(--line2)">'})};
  $$('#mdRange .chip').forEach(function(c){c.onclick=function(){
    DB.moodRangeSel=DB.moodRangeSel||{kind:'month'};
    DB.moodRangeSel.kind=c.dataset.r;
    if(c.dataset.r==='custom'){DB.moodRangeSel.from=DB.moodRangeSel.from||TODAY();DB.moodRangeSel.to=DB.moodRangeSel.to||TODAY()}
    save();renderMood();
  }});
  var mdRF=$('#mdRFrom');if(mdRF)mdRF.onchange=function(){DB.moodRangeSel.from=mdRF.value||TODAY();save();renderMood()};
  var mdRT=$('#mdRTo');if(mdRT)mdRT.onchange=function(){DB.moodRangeSel.to=mdRT.value||TODAY();save();renderMood()};
  $('#mdReport').onclick=genMoodReport;
  $('#addMCat').onclick=function(){
    var v=$('#newMCat').value.trim();if(!v)return toast('写个心情名');
    if(moodColor(v)!=='#BFA3E8'||v==='')return toast('已经有这个心情了');
    DB.catMoodExtra.push({k:v,c:MOOD_EXTRA_COLORS[DB.catMoodExtra.length%MOOD_EXTRA_COLORS.length]});
    save();renderMood();toast('新心情已上架');
  };
  $$('#bMood [data-mdelcat]').forEach(function(x){x.onclick=function(){
    DB.catMoodExtra=DB.catMoodExtra.filter(function(m){return m.k!==x.dataset.mdelcat});save();renderMood()}});
  $$('#bMood [data-mcat]').forEach(function(i){i.onchange=function(){
    var old=i.dataset.mcat,nv=i.value.trim()||old;
    DB.catMoodExtra.forEach(function(m){if(m.k===old)m.k=nv});
    DB.mood.forEach(function(m){if(m.mood===old)m.mood=nv});
    save();renderMood();toast('已改名，旧记录同步更新')}});
  $('#mdAdd').onclick=function(){
    var v=$('#mdTxt').value.trim();
    if(!v&&!window.__ph)return toast('写一句，或者拍张照');
    var id=uid();
    DB.mood.push({id:id,date:TODAY(),text:v||'(只有一张照片)',mood:moodPick,photo:window.__ph||''});
    window.__ph='';save();renderMood();
    toast('存进树洞了');
    var p=panel('<div class="loader"><div class="lp"></div><div class="lt">树洞正在回应你…</div></div>');
    AI.call('你是一个温柔的树洞，会对用户的倾诉给出一句 30 字以内、真诚不鸡汤的回应。',
      '我说的是：'+v,function(){return MOCK.moodEcho({seed:id,mood:moodPick})},'default')
      .then(function(r){DB.echo[id]=r.text;save();
        p.innerHTML='<button class="closex" data-close>×</button><div class="ph">树洞回声</div>'+
          '<div class="quote" style="margin:14px 0 18px">'+esc(r.text)+'</div>'+
          '<div class="mini" style="text-align:center">'+(r.mock?'（模拟文案）':'（DeepSeek 生成）')+'</div>'+
          '<button class="btn pri" data-close style="width:100%;margin-top:16px">收下</button>';
        renderMood();});
  };
  if($('#mEchoMore'))$('#mEchoMore').onclick=function(){DB.__ui=DB.__ui||{};DB.__ui.mood=!DB.__ui.mood;renderMood();};
  $$('#bMood [data-del]').forEach(function(x){x.onclick=function(){
    DB.mood=DB.mood.filter(function(e){return e.id!==x.dataset.del});delete DB.echo[x.dataset.del];save();renderMood()}});
  $$('#bMood [data-echo]').forEach(function(x){x.onclick=function(){
    var id=x.dataset.echo;var e=DB.mood.filter(function(m){return m.id===id})[0];
    var p=panel('<div class="loader"><div class="lp"></div><div class="lt">树洞正在回应你…</div></div>');
    AI.call('你是一个温柔的树洞，会对用户的倾诉给出一句 30 字以内、真诚不鸡汤的回应。','我说的是：'+e.text,
      function(){return MOCK.moodEcho({seed:id,mood:e.mood})},'default')
      .then(function(r){DB.echo[id]=r.text;save();closeModal('mMod');renderMood()});
  }});
}

/* ============================================================
   ④ 白日梦想家（三分区）
   ============================================================ */
var dreamTab='idea',dreamType='奇思妙想';
function renderDream(){
  var b=$('#bDream');
  var ideas=DB.dream.ideas.slice().sort(function(a,c){return a.date<c.date?1:-1});
  var flags=DB.dream.flags.slice().sort(function(a,c){return (a.done?1:0)-(c.done?1:0)||(a.target<c.target?-1:1)});
  var letters=DB.dream.letters.slice().sort(function(a,c){return a.openAt<c.openAt?-1:1});
  var head='<div class="tabs">'+
    [['idea','奇思妙想'],['flag','立 flag'],['letter','给未来的信']].map(function(t){
      return '<button class="chip'+(dreamTab===t[0]?' on':'')+'" data-tab="'+t[0]+'">'+t[1]+'</button>'}).join('')+'</div>';
  var body='';
  if(dreamTab==='idea'){
    body='<div class="sec"><div class="sec-t">此刻一念<span class="r">念起便写</span></div>'+
      '<div class="box">'+
        '<div class="chips" style="margin-bottom:10px" id="drType">'+
          ['奇思妙想','做过的梦','想成为的自己'].map(function(t){return '<button class="chip'+(dreamType===t?' on':'')+'" data-t="'+t+'">'+t+'</button>'}).join('')+'</div>'+
        '<textarea class="inp" id="drTxt" rows="3" placeholder="'+(dreamType==='做过的梦'?'昨夜，我梦见…':'落笔，便成真')+'"></textarea>'+
        '<div class="row" style="margin-top:10px">'+
          '<button class="btn" id="drVoice"><svg viewBox="0 0 24 24"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/></svg>说出来</button>'+
          '<button class="btn pri" id="drAdd">收进梦里</button></div>'+
      '</div></div>'+
      '<div class="sec"><div class="sec-t">梦境储藏<span class="r">'+ideas.length+' 条</span></div>'+
      '<div class="box">'+(ideas.length?ideas.map(function(e){
        return '<div class="item"><span class="dot" style="color:#BFA3E8;background:#BFA3E8"></span><div class="c">'+
          '<div class="t">'+esc(e.text)+'</div><div class="m"><span class="tagx">'+esc(e.type)+'</span>'+cnDate(e.date)+'</div></div>'+
          '<button class="x" data-idel="'+e.id+'">×</button></div>';
      }).join(''):'<div class="empty">储藏室还空着</div>')+'</div></div>';
      +'<div class="sec"><div class="sec-t">梦想年报<span class="r">像心情年报一样</span></div>'+'<div class="box"><button class="btn pri" id="drReport" style="width:100%">生成我的梦想年报</button>'+'<div class="mini" style="margin-top:8px;text-align:center">掌柜为你写一份痴想与 Flag 的回顾</div></div></div>';
  }else if(dreamTab==='flag'){
    body='<div class="sec"><div class="sec-t">立一面旗<span class="r">日子自择</span></div>'+
      '<div class="box"><div class="row" style="margin-bottom:10px">'+
        '<input class="inp" id="fTxt" placeholder="譬如：一年后，考过 PMP" style="flex:1"></div>'+
        '<div class="row"><input class="inp" id="fDate" type="date" style="flex:1" value="'+dayAgo(-180)+'">'+
        '<button class="btn sm pri" id="fAdd">立</button></div>'+
        '<div class="mini" style="margin-top:8px">日子由你定——一月、一年、十载皆可。掌柜自会提醒。</div></div></div>'+
      '<div class="sec"><div class="sec-t">我曾立的旗<span class="r">'+flags.filter(function(f){return !f.done}).length+' 个在路上</span></div>'+
      '<div class="box">'+(flags.length?flags.map(function(f){
        var left=daysBetween(TODAY(),f.target);
        return '<div style="padding:11px 0;border-bottom:1px dashed var(--line2)">'+
          '<div style="display:flex;align-items:flex-start;gap:8px">'+
            '<span class="dot" style="color:'+(f.done?'#8FD8C4':'#F2A9BC')+';background:'+(f.done?'#8FD8C4':'#F2A9BC')+';margin-top:6px"></span>'+
            '<div style="flex:1"><div class="t" style="font-size:13px;'+(f.done?'opacity:.5;text-decoration:line-through':'')+'">'+esc(f.text)+'</div>'+
            '<div class="m">'+(f.done?'已完成':'目标 '+cnDate(f.target)+' · '+(left>=0?('还有 '+left+' 天'):('已过去 '+(-left)+' 天')))+'</div></div>'+
            '<button class="x" data-fdel="'+f.id+'">×</button></div>'+
          '<div class="row" style="margin-top:8px">'+
            '<button class="btn sm" data-nudge="'+f.id+'">AI 提醒我</button>'+
            '<button class="btn sm" data-fdone="'+f.id+'">'+(f.done?'重新出发':'做到了')+'</button></div>'+
          '</div>';
      }).join(''):'<div class="empty">尚未立旗<br>人总得给自己留个念想</div>')+'</div></div>';
  }else{
    body='<div class="sec"><div class="sec-t">寄给未来的信<span class="r">开启之日自择</span></div>'+
      '<div class="box">'+
        '<textarea class="inp" id="lTxt" rows="4" placeholder="寄给未来的自己…"></textarea>'+
        '<div class="row" style="margin-top:10px">'+
          '<input class="inp" id="lDate" type="date" style="flex:1" value="'+dayAgo(-365)+'">'+
          '<button class="btn sm pri" id="lAdd">封存</button></div>'+
        '<div class="row" style="margin-top:8px">'+
          ['30','365','730'].map(function(d){return '<button class="chip" data-ldq="'+d+'">'+(d==='30'?'一个月后':d==='365'?'一年后':'两年后')+'</button>'}).join('')+
        '</div></div></div>'+
      '<div class="sec"><div class="sec-t">信箱<span class="r">'+letters.length+' 封</span></div>'+
      (letters.length?letters.map(function(l){
        var left=daysBetween(TODAY(),l.openAt);
        var open=left<=0;
        return '<div class="letter'+(open?'':' sealed')+'" data-l="'+l.id+'">'+
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">'+
            '<div class="wax">印</div>'+
            '<div><div style="font-family:var(--serif);font-size:13px;letter-spacing:1px;color:var(--gold)">'+(open?'已开启 · 来自 '+cnDate(l.created):'封存中 · '+cnDate(l.created)+' 寄出')+'</div>'+
            '<div class="mini">'+(open?'':('距离开启还有 '+left+' 天 · '+l.openAt))+'</div></div>'+
            '<button class="x" style="margin-left:auto" data-ldel="'+l.id+'">×</button></div>'+
          '<div class="bd" style="font-size:12.5px;line-height:1.95;white-space:pre-wrap">'+esc(l.text)+'</div>'+
          (open?'':'<div class="mini" style="text-align:center;margin-top:10px;letter-spacing:1.4px">火漆未启</div>')+
          '</div>';
      }).join(''):'<div class="box"><div class="empty">尚无寄出之信</div></div>')+'</div>';
  }
  b.innerHTML=head+body;
  $$('#bDream .tabs .chip').forEach(function(c){c.onclick=function(){dreamTab=c.dataset.tab;renderDream()}});
  if(dreamTab==='idea'){
    $$('#drType .chip').forEach(function(c){c.onclick=function(){dreamType=c.dataset.t;renderDream()}});
    if($('#drReport'))$('#drReport').onclick=genDreamReport;
    $('#drVoice').onclick=function(){startVoice('dream',function(tx){$('#drTxt').value=tx})};
    $('#drAdd').onclick=function(){
      var v=$('#drTxt').value.trim();if(!v)return toast('还什么都没写');
      DB.dream.ideas.push({id:uid(),date:TODAY(),type:dreamType,text:v});save();renderDream();toast('收进梦里了');
    };
    $$('#bDream [data-idel]').forEach(function(x){x.onclick=function(){
      DB.dream.ideas=DB.dream.ideas.filter(function(e){return e.id!==x.dataset.idel});save();renderDream()}});
  }else if(dreamTab==='flag'){
    $('#fAdd').onclick=function(){
      var v=$('#fTxt').value.trim();if(!v)return toast('写下你的 flag');
      DB.dream.flags.push({id:uid(),text:v,target:$('#fDate').value||dayAgo(-180),created:TODAY(),done:false});
      save();renderDream();toast('flag 已立，AI 会记得提醒你');
    };
    $$('#bDream [data-fdel]').forEach(function(x){x.onclick=function(){DB.dream.flags=DB.dream.flags.filter(function(f){return f.id!==x.dataset.fdel});save();renderDream()}});
    $$('#bDream [data-fdone]').forEach(function(x){x.onclick=function(){
      DB.dream.flags.forEach(function(f){if(f.id===x.dataset.fdone)f.done=!f.done});save();renderDream()}});
    $$('#bDream [data-nudge]').forEach(function(x){x.onclick=function(){
      var f=DB.dream.flags.filter(function(g){return g.id===x.dataset.nudge})[0];if(!f)return;
      var p=panel('<div class="loader"><div class="lp"></div><div class="lt">AI 正在回想你说过的话…</div></div>');
      var left=daysBetween(TODAY(),f.target);
      AI.call('你是「光阴的故事」里的梦想守护者，会温柔而坚定地提醒用户曾经立下的 flag。',
        'flag：'+f.text+'，立下于 '+f.created+'，目标日 '+f.target+'，还剩 '+left+' 天。请写一段 80 字以内的提醒。',
        function(){return MOCK.flag({text:f.text,created:f.created,left:left})},'default')
        .then(function(r){
          p.innerHTML='<button class="closex" data-close>×</button><div class="ph">还记得吗</div>'+
            '<div class="quote" style="margin:14px 0 8px">'+esc(r.text).replace(/\n/g,'<br>')+'</div>'+
            '<div class="mini" style="text-align:center">'+(r.mock?'（模拟文案）':'（DeepSeek 生成）')+'</div>'+
            '<button class="btn pri" data-close style="width:100%;margin-top:16px">我记得</button>';
          chime();
        });
    }});
  }else{
    $$('#bDream [data-ldq]').forEach(function(x){x.onclick=function(){
      $('#lDate').value=dayAgo(-parseInt(x.dataset.ldq,10))}});
    $('#lAdd').onclick=function(){
      var v=$('#lTxt').value.trim();if(!v)return toast('还没写信');
      var d=$('#lDate').value||dayAgo(-365);
      DB.dream.letters.push({id:uid(),text:v,created:TODAY(),openAt:d});
      save();renderDream();toast('已封存 · 火漆盖印 · '+cnDate(d)+'开启');
    };
    $$('#bDream [data-ldel]').forEach(function(x){x.onclick=function(){
      DB.dream.letters=DB.dream.letters.filter(function(l){return l.id!==x.dataset.ldel});save();renderDream()}});
  }
}

/* ============================================================
   ⑤ 我们的纪念 —— 粉色书 · 翻页
   ============================================================ */
var bookIdx=0;
function renderMem(){
  var p=$('#pMem');
  if(!DB.mem.on || (DB.__ui&&DB.__ui.showMemGate)){
    p.classList.remove('mem-open');
    p.innerHTML='<button class="mem-back" id="memBack"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>回当铺</button>'+
      '<div class="gate" style="position:static;background:none;min-height:82vh">'+
      '<div class="door" id="memAlbum" title="点开相册" style="width:120px;cursor:pointer;filter:drop-shadow(0 8px 30px rgba(242,169,188,.35))"><svg viewBox="0 0 120 120">'+
      '<ellipse cx="60" cy="62" rx="42" ry="46" fill="#F2A9BC" opacity=".13"/>'+
      '<rect x="30" y="28" width="62" height="74" rx="7" fill="rgba(242,169,188,.10)" stroke="#E08EA6" stroke-width="1.6"/>'+
      '<rect x="36" y="34" width="50" height="62" rx="4" fill="rgba(255,247,250,.5)" stroke="#F2A9BC" stroke-width="1.1"/>'+
      '<path d="M36 34v62" stroke="#E08EA6" stroke-width="2.2"/>'+
      '<path d="M61 80c-8.5-6.8-14.5-11.4-14.5-17.4a7.6 7.6 0 0 1 14.5-3.2 7.6 7.6 0 0 1 14.5 3.2C75.5 68.6 69.5 73.2 61 80z" fill="#F2A9BC"/>'+
      '<rect x="74" y="16" width="27" height="21" rx="3" transform="rotate(9 87 26)" fill="rgba(255,220,230,.9)" stroke="#E08EA6" stroke-width="1.2"/>'+
      '<circle cx="83" cy="24" r="2.6" transform="rotate(9 87 26)" fill="#E08EA6"/>'+
      '<path d="M76 34l7-5.5 6 4.5 8-4.5V34z" transform="rotate(9 87 26)" fill="#F2A9BC"/>'+
      '<path d="M22 42l1.6 3.4 3.4 1.6-3.4 1.6-1.6 3.4-1.6-3.4-3.4-1.6 3.4-1.6z" fill="#F2A9BC"/>'+
      '<path d="M99 60l1.3 2.7 2.7 1.3-2.7 1.3-1.3 2.7-1.3-2.7-2.7-1.3 2.7-1.3z" fill="#FFDCE6"/>'+
      '<path d="M96 96l1.2 2.4 2.4 1.2-2.4 1.2-1.2 2.4-1.2-2.4-2.4-1.2 2.4-1.2z" fill="#F2A9BC" opacity=".8"/>'+
      '<path d="M18 84c-2.4-1.9-4.1-3.2-4.1-4.9a2.2 2.2 0 0 1 4.1-.9 2.2 2.2 0 0 1 4.1.9c0 1.7-1.7 3-4.1 4.9z" fill="#F2A9BC" opacity=".7"/>'+
      '</svg></div>'+
      '<button id="memOpen" style="cursor:pointer;font:inherit;font-size:26px;letter-spacing:3px;color:var(--rose);text-shadow:0 0 26px rgba(242,169,188,.3);background:rgba(242,169,188,.08);border:1px solid rgba(242,169,188,.35);border-radius:999px;padding:10px 26px;margin:2px 0">'+esc(DB.mem.name||'我们的纪念')+'</button>'+
      '<p class="gate-sub">把平凡的日子，存进只属于两个人的纪念册<br>在这里收藏你们共同的轨迹</p>'+
      '<div class="gate-foot">轻触标题或相册即可开启 · 每一页都是你们相爱的证据</div></div>';
    function memOpenGo(){
      if(DB.mem.on){DB.__ui=DB.__ui||{};DB.__ui.showMemGate=false;renderMem();return;}
      ask('开启这段纪念','一旦开启，这里会开始记录你们的时光。<br>以后每一个平凡的日子，都值得被好好收藏。','开启',false)
        .then(function(y){if(y){DB.mem.on=true;save();bookIdx=0;DB.__ui=DB.__ui||{};DB.__ui.showMemGate=false;renderMem();chime();toast('纪念册已开启')}});
    }
    $('#memOpen').onclick=memOpenGo;
    $('#memAlbum').onclick=memOpenGo;
    $('#memBack').onclick=function(){setDeck(0)};
    return;
  }
  p.classList.add('mem-open');
  var es=DB.mem.entries.map(function(e,i){return {e:e,i:i}})
    .sort(function(a,c){if(a.e.date!==c.e.date)return a.e.date<c.e.date?1:-1;return c.i-a.i})
    .map(function(x){return x.e});

  function pageCard(e){
    return '<div class="mem-page"><div class="corner">'+cnDate(e.date)+(e.title?' · '+esc(e.title):'')+'</div>'+
      (e.text?'<div class="btxt">'+esc(e.text)+'</div>':'')+
      (e.photos&&e.photos.length?'<div class="bphotos">'+e.photos.map(function(s){return '<img src="'+s+'" alt="">'}).join('')+'</div>':'')+
      '<div class="heart-bg">♥</div></div>';
  }

  function memMonthLabel(k){
    var y=k.slice(0,4),m=parseInt(k.slice(5),10),ny=TODAY().slice(0,4);
    return (y===ny?m+'月':y+'年'+m+'月');
  }
  var memGroups=[];
  es.forEach(function(e){
    var mk=e.date.slice(0,7),wk=weekStart(e.date);
    var g=memGroups[memGroups.length-1];
    if(!g||g.k!==mk){g={k:mk,label:memMonthLabel(mk),weeks:[],n:0};memGroups.push(g)}
    var w=g.weeks[g.weeks.length-1];
    if(!w||w.k!==wk){
      w={k:wk,label:cnDate(wk)+' - '+cnDate(weekEnd(wk)),items:[],n:0};
      g.weeks.push(w);
    }
    w.items.push(e);w.n++;g.n++;
  });
  var memListHtml=memGroups.length?memGroups.map(function(g,gi){
    return '<div class="mem-fold'+(gi===0?' open':'')+'">'+
      '<button type="button" class="mem-foldh"><span class="t">'+esc(g.label)+'</span>'+
        '<span class="n">'+g.n+' 页</span><span class="a">▾</span></button>'+
      '<div class="mem-foldb">'+g.weeks.map(function(w,wi){
        return '<div class="mem-week'+(gi===0&&wi===0?' open':'')+'">'+
          '<button type="button" class="mem-weekh"><span class="t">'+esc(w.label)+'</span>'+
            '<span class="n">'+w.n+' 页</span><span class="a">▾</span></button>'+
          '<div class="mem-weekb">'+w.items.map(pageCard).join('')+'</div></div>';
      }).join('')+'</div></div>';
  }).join(''):'<div class="mem-empty">纪念册还空着。第一页，从今天开始写。</div>';
  p.innerHTML='<div class="mem-wrap">'+
    '<div class="mem-top"><button class="mem-back" id="memBack"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>'+
      '<div class="mt-c"><div class="t">'+esc(DB.mem.name||'我们的纪念')+'</div><div class="st">'+esc(DB.mem.sub||'')+'</div></div>'+
      '<button id="bkEdit" title="名字与文案"><svg viewBox="0 0 24 24"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="M13.5 6.5l3 3"/></svg></button>'+
      '<button id="bkDove" title="封存这段故事"><svg viewBox="0 0 24 24"><path d="M20.8 4.2c-5.8.2-10.3 3.2-12.3 8.6l-1.9 4.9 4.9-1.9c5.4-2 8.4-6.5 8.6-12.3z"/><path d="M6.5 17.5c1.8-4.6 5.4-7.4 10.2-8.3" opacity=".5"/></svg></button></div>'+
    '<div class="mem-cover" id="memCover">'+
      '<div class="mc-k">扉 页</div>'+
      '<div class="mc-q">'+esc(DB.mem.custom||DB.mem.quote||'数不清原来跳动的画面')+'</div>'+
      '<div class="mc-n">'+esc((DB.mem.names||['我','你'])[0])+' ♥ '+esc((DB.mem.names||['我','你'])[1])+'</div>'+
      '<div class="mc-e">点一下，改扉页文案</div>'+
    '</div>'+
    '<div class="mem-card">'+
      '<div class="row" style="margin-bottom:10px">'+
        '<input class="inp" id="meDate" type="date" value="'+TODAY()+'" style="flex:none;width:46%">'+
        '<input class="inp" id="meTitle" placeholder="这一天，叫什么?" style="flex:1"></div>'+
      '<textarea class="inp" id="meTxt" rows="3" placeholder="写下你们的故事，哪怕只有一句话……"></textarea>'+
      '<div class="mem-acts">'+
        '<button class="rnd" id="meMic" title="说一段"><svg viewBox="0 0 24 24"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><path d="M12 18v3"/></svg></button>'+
        '<button class="rnd" id="mePhoto" title="放张照片"><svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.2"/></svg></button>'+
        '<button class="btn rose" id="meAdd">存入纪念册</button></div>'+
      '<div class="pmem-photos" id="mePrev"></div>'+
    '</div>'+
    '<button class="btn rep" id="bkReport">💌 生成我们的故事报告</button>'+
    memListHtml+
    '</div>';

  $('#memBack').onclick=function(){setDeck(0)};
  function openMemEdit(){
    var names=DB.mem.names||['我','你'];
    var p2=panel('<div class="ph">名字与文案</div>'+
      '<div class="pd" style="text-align:left">模块名称（标题和首页入口一起变）：</div>'+
      '<input class="inp" id="nmMod" value="'+esc(DB.mem.name||'我们的纪念')+'" style="margin-bottom:12px">'+
      '<div class="pd" style="text-align:left">副标题（标题下面那行小字）：</div>'+
      '<input class="inp" id="nmSub" value="'+esc(DB.mem.sub||'')+'" placeholder="给你们的故事，起个副标题" style="margin-bottom:14px">'+
      '<div class="pd" style="text-align:left">扉页上的名字：</div>'+
      '<div class="row" style="margin-bottom:14px">'+
        '<input class="inp" id="nm1" value="'+esc(names[0])+'" style="flex:1">'+
        '<span class="mini">&</span>'+
        '<input class="inp" id="nm2" value="'+esc(names[1])+'" style="flex:1"></div>'+
      '<div class="pd" style="text-align:left">扉页文案（写一句只属于你们的话）：</div>'+
      '<input class="inp" id="qIn" value="'+esc(DB.mem.custom||'')+'" placeholder="数不清原来跳动的画面" style="margin-bottom:14px">'+
      '<div class="row"><button class="btn" data-close>取消</button><button class="btn pri" id="qOk">就用这套</button></div>');
    $('#qOk').onclick=function(){
      DB.mem.name=$('#nmMod').value.trim()||'我们的纪念';
      DB.mem.sub=$('#nmSub').value.trim()||'';
      DB.mem.names=[$('#nm1').value.trim()||'我',$('#nm2').value.trim()||'你'];
      DB.mem.custom=$('#qIn').value.trim();
      if(DB.mem.custom)DB.mem.quote=DB.mem.custom;
      save();closeModal('mMod');renderMem();renderHome();toast('扉页已更新');
    };
  }
  $('#bkEdit').onclick=openMemEdit;
  $('#memCover').onclick=openMemEdit;
  $('#bkDove').onclick=openDove;
  $('#bkReport').onclick=openLoveReport;
  $$('.mem-foldh').forEach(function(h){
    h.onclick=function(){h.parentNode.classList.toggle('open')};
  });
  $$('.mem-weekh').forEach(function(h){
    h.onclick=function(){h.parentNode.classList.toggle('open')};
  });
  $('#meMic').onclick=function(){startVoice('mem',function(tx){$('#meTxt').value=tx})};
  $('#mePhoto').onclick=function(){pickPhoto(function(d){
    window.__mp=window.__mp||[];window.__mp.push(d);
    $('#mePrev').innerHTML=window.__mp.map(function(s){return '<img src="'+s+'">'}).join('')})};
  $('#meAdd').onclick=function(){
    var v=$('#meTxt').value.trim();
    var dv=$('#meDate').value||TODAY();
    if(!v&&!(window.__mp||[]).length)return toast('写一句，或者放张照片');
    DB.mem.entries.push({id:uid(),date:dv,title:$('#meTitle').value.trim(),text:v||'',photos:window.__mp||[]});
    window.__mp=[];save();renderMem();chime();toast('这一页，写进纪念册了');
  };
}

/* ---------- 鸽子 · 封存这段故事 ---------- */
function openDove(){
  flipChime();
  panel('<div class="ph">封存这段故事</div>'+
    '<div class="pd">失恋了，或者只是想暂时收起来？<br>记录是你们的，选择也是。</div>'+
    '<button class="dove-keep" id="dkKeep">🕊 永久珍藏并关闭纪念册</button>'+
    '<button class="dove-burn" id="dkBurn">🔥 销毁所有记录</button>'+
    '<button class="dove-no" data-close>再 想 想</button>');
  $('#dkKeep').onclick=function(){
    ask('永久珍藏','纪念册会关闭，但所有记录都会被留下。<br>哪天想看了，随时可以重新开启。','珍藏',false)
      .then(function(y){if(y){DB.mem.on=false;save();renderMem();toast('已珍藏 · 随时可重启')}});
  };
  $('#dkBurn').onclick=function(){
    ask('彻底销毁','这里的所有记录将被抹去，<br>不可恢复，不可找回。<br><br>确定吗？','销毁',true)
      .then(function(y){if(y){
        DB.mem={on:false,name:'我们的纪念',sub:'',names:['我','你'],quote:'数不清原来跳动的画面',style:'lyric',entries:[]};
        save();renderMem();toast('已抹去');
      }});
  };
}

/* ---------- 恋爱故事报告（自定义时间段 · 飞书/网易云年度账单式） ---------- */
function openLoveReport(){
  var p=panel('<div class="ph">我们的故事报告</div>'+
    '<div class="pd" style="text-align:left">挑一段时间，掌柜把你们的故事装订成册——像年度账单那样，一页一页都是你们。</div>'+
    '<div class="pd" style="text-align:left;margin-bottom:6px">时间段</div>'+
    '<div class="chips" style="margin-bottom:12px" id="lrRange">'+
      [['year','按年'],['7','近 7 天'],['30','近 30 天'],['90','近 90 天'],['all','全部'],['custom','自定义']].map(function(s){
        return '<button class="chip'+(s[0]==='year'?' on':'')+'" data-r="'+s[0]+'">'+s[1]+'</button>'}).join('')+'</div>'+
    '<div id="lrCustomRange" style="display:none;margin-bottom:12px">'+
      '<div class="row" style="margin-bottom:8px">'+
        '<input class="inp" id="lrFrom" type="date" value="'+dayAgo(29)+'" style="flex:1">'+
        '<span class="mini" style="flex:none">至</span>'+
        '<input class="inp" id="lrTo" type="date" value="'+TODAY()+'" style="flex:1"></div>'+
      '<div class="mini" style="letter-spacing:1px">挑一段属于你们的日子，掌柜按这个区间装订。</div></div>'+
    '<div class="pd" style="text-align:left;margin-bottom:6px">文案风格</div>'+
    '<div class="chips" style="margin-bottom:10px" id="lrStyle">'+
      [['lyric','歌词'],['poem','古诗词'],['net','网络梗'],['custom','自选']].map(function(s){
        return '<button class="chip'+(s[0]==='lyric'?' on':'')+'" data-s="'+s[0]+'">'+s[1]+'</button>'}).join('')+'</div>'+
    '<input class="inp" id="lrCustom" placeholder="自选风格，比如：武侠风、王家卫风" style="display:none;margin-bottom:14px">'+
    '<div class="row"><button class="btn" id="lrH5" style="flex:1">H5 动态报告</button><button class="btn rose" id="lrGo" style="flex:1">生成文字报告</button></div>'+
    '<div class="mini" style="margin-top:10px;text-align:center;letter-spacing:1px">H5 动态报告为 V2 规划功能 · 敬请期待</div>');
  var rng='year',sty='lyric';
  $$('#lrRange .chip').forEach(function(c){c.onclick=function(){
    $$('#lrRange .chip').forEach(function(x){x.classList.remove('on')});c.classList.add('on');rng=c.dataset.r;
    var box=$('#lrCustomRange');if(box)box.style.display=rng==='custom'?'block':'none';}});
  $$('#lrStyle .chip').forEach(function(c){c.onclick=function(){
    $$('#lrStyle .chip').forEach(function(x){x.classList.remove('on')});c.classList.add('on');sty=c.dataset.s;
    $('#lrCustom').style.display=sty==='custom'?'block':'none';}});
  $('#lrH5').onclick=function(){genLoveReport(p,rng,sty,true)};
  $('#lrGo').onclick=function(){genLoveReport(p,rng,sty,false)};
}
function genLoveReport(p,rng,sty,h5){
  var es=(DB.mem.entries||[]).slice().sort(function(a,c){return a.date<c.date?-1:1});
  var rangeTxt='';
  if(rng==='custom'){
    var f=($('#lrFrom')||{}).value||'',t=($('#lrTo')||{}).value||'';
    if(f){es=es.filter(function(e){return e.date>=f});rangeTxt+=cnDate(f)}
    if(t){es=es.filter(function(e){return e.date<=t});rangeTxt+=' — '+cnDate(t)}
    if(!rangeTxt)rangeTxt='全部';
  }else if(rng==='year'){
    var y0=es.length?es[0].date.slice(0,4):String(new Date().getFullYear());
    var from=y0+'-01-01';
    es=es.filter(function(e){return e.date>=from});
    rangeTxt=y0+' 年';
  }else if(rng!=='all'){var from=dayAgo(parseInt(rng,10)-1);es=es.filter(function(e){return e.date>=from});
    rangeTxt='近 '+rng+' 天';}else{rangeTxt='全部';}
  if(!es.length)return toast('这段时间还没有记录，先写下第一页吧');
  var pics=0,tot=0;es.forEach(function(e){pics+=(e.photos||[]).length;tot+=String(e.text||'').length});
  var lastD=es[es.length-1].date>TODAY()?TODAY():es[es.length-1].date;
  var days=daysBetween(es[0].date>lastD?lastD:es[0].date,lastD)+1;
  var sample=es.slice(-3).map(function(e){return cnDate(e.date)+(e.title?'「'+e.title+'」':'')+(e.text||'')}).join('；');
  var styleName=sty==='custom'?((($('#lrCustom')||{}).value||'').trim()||'自选风'):({lyric:'歌词',poem:'古诗词',net:'网络梗'})[sty];
  var lqSeed=String(es.length)+es[0].date+TODAY();
  var lq=sty==='poem'?MOCK.memQuote({style:'poem',seed:lqSeed}):sty==='net'?MOCK.memQuote({style:'net',seed:lqSeed}):sty==='custom'?randomQuote(lqSeed):MOCK.memQuote({style:'lyric',seed:lqSeed});
  p.innerHTML='<button class="closex" data-close>×</button><div class="loader"><div class="lp"></div><div class="lt">掌柜正在装订你们的故事…</div></div>';
  var sys='你在为一款叫「光阴的故事」的 App 写「我们的故事报告」，像网易云年度听歌报告那样温柔动人。';
  var user='时间段内：'+es.length+' 条记录、'+pics+' 张照片、跨 '+days+' 天、共 '+tot+' 字。最近的记录：'+sample+'。'+
    '请用「'+styleName+'」风格写 130 字以内的恋爱故事报告：开头一句总起，中间点出你们记录的日常与仪式感，结尾一句情话收束。只输出报告正文。';
  var fb=function(){
    return '这 '+days+' 天里，你们一起写下了 '+es.length+' 页故事。从「'+(es[0].title||'第一页')+'」写到「'+(es[es.length-1].title||'今天')+'」，日子一页一页翻过去，喜欢一点一点攒起来。\n浪漫不一定是烟花，你们更像一盏台灯——不惊艳，但一直亮着。\n愿往后的每一页，都写着彼此的名字。';
  };
  AI.call(sys,user,fb,sty==='custom'?styleName:sty,{report:true}).then(function(r){
    p.innerHTML='<button class="closex" data-close>×</button>'+
      '<div class="ph">'+(h5?'我们的故事 · H5 预览':'我们的故事报告')+'</div>'+
      (h5?'<div class="mini" style="margin-bottom:10px;text-align:center;letter-spacing:1px;color:#E9A9BC">🕊 H5 动态报告为 V2 规划功能 · 当前为模拟数据故事预览</div>':'')+
      '<div class="box" style="margin-bottom:12px">'+
        '<div class="kv"><span>记录天数</span><b>'+days+'</b></div>'+
        '<div class="kv"><span>写下瞬间</span><b>'+es.length+' 页</b></div>'+
        '<div class="kv"><span>留住照片</span><b>'+pics+' 张</b></div>'+
        '<div class="kv"><span>故事字数</span><b>'+tot+' 字</b></div>'+
      '</div>'+
      '<div class="quote">'+esc(r.text)+(r.mock?'<span class="mini" style="display:block;margin-top:6px;letter-spacing:1px">—— 掌柜（模拟文案模式）</span>':'')+'</div>'+
      '<div class="quote" style="margin-top:10px;border-top:1px dashed var(--line2);padding-top:14px">'+esc(lq)+'</div>'+
      '<div class="mini" style="text-align:center;letter-spacing:2px;margin-top:10px">'+esc(rangeTxt)+' · 风格：'+esc(styleName)+' · '+cnDate(TODAY())+'</div>';
  });
}

/* ============================================================
   月光宝盒
   ============================================================ */
function openBox(){
  var d=dayAgo(7);
  var p=panel('<div class="ph">月光宝盒</div>'+
    '<div class="pd">穿越回任意一日，看那日的光阴、铜钱、心绪与痴想。<br>亦可以今日的目光，给那日的自己捎句话。</div>'+
    '<input class="inp" id="bxDate" type="date" value="'+d+'" style="margin-bottom:14px">'+
    '<div id="bxBody"></div>');
  var render=function(){
    var v=$('#bxDate').value;
    var t=DB.time.filter(function(e){return e.date===v})[0];
    var mo=DB.money.filter(function(e){return e.date===v});
    var md=DB.mood.filter(function(e){return e.date===v});
    var dr=DB.dream.ideas.filter(function(e){return e.date===v});
    var spent=mo.reduce(function(s,x){return s+x.amt},0);
    var s='';
    if(!t&&!mo.length&&!md.length&&!dr.length)s='<div class="empty">那一日，空空如也。<br>换一日再试。</div>';
    else{
      s+='<div class="box" style="margin-bottom:12px">';
      if(t){
        s+='<div class="mini" style="margin-bottom:6px">那日所计划</div>'+
          (t.plan||[]).map(function(x){return '<div class="item"><span class="dot" style="color:#F0D394;background:#F0D394"></span><div class="c"><div class="t">'+esc(x.t)+'</div><div class="m">'+x.min+' 分钟</div></div></div>'}).join('')+
          '<div class="mini" style="margin:10px 0 6px">那日所经历</div>'+
          (t.actual||[]).map(function(x){return '<div class="item"><span class="dot" style="color:#9BA8F0;background:#9BA8F0"></span><div class="c"><div class="t">'+esc(x.t)+'</div><div class="m">'+x.min+' 分钟</div></div></div>'}).join('');
      }
      if(mo.length)s+='<div class="mini" style="margin:10px 0 6px">花去 ¥'+money(spent)+'</div>'+
        mo.map(function(e){var c=catOf(e.cat);return '<div class="item"><span class="dot" style="color:'+c.c+';background:'+c.c+'"></span><div class="c"><div class="t">'+esc(e.note)+'</div><div class="m"><span class="tagx">'+esc(c.n)+'</span></div></div><div style="font-family:var(--serif);color:var(--gold);font-size:13px">¥'+num(e.amt)+'</div></div>'}).join('');
      if(md.length)s+='<div class="mini" style="margin:10px 0 6px">那日心绪</div>'+
        md.map(function(e){var c=moodColor(e.mood||'');return '<div class="item"><span class="dot" style="color:'+c+';background:'+c+'"></span><div class="c"><div class="t">'+esc(e.text)+'</div><div class="m">'+(e.mood||'未分类')+'</div></div></div>'}).join('');
      if(dr.length)s+='<div class="mini" style="margin:10px 0 6px">那日所想</div>'+
        dr.map(function(e){return '<div class="item"><span class="dot" style="color:#BFA3E8;background:#BFA3E8"></span><div class="c"><div class="t">'+esc(e.text)+'</div><div class="m">'+esc(e.type)+'</div></div></div>'}).join('');
      s+='</div>';
    }
    var old=DB.box.filter(function(x){return x.date===v})[0];
    s+='<div class="sec-t" style="margin-top:16px">以今日的目光，给那日的自己写句话</div>'+
      '<textarea class="inp" id="bxTxt" rows="3" placeholder="譬如：别急，后来都过去了">'+(old?esc(old.text):'')+'</textarea>'+
      '<div class="row" style="gap:8px;margin-top:14px">'+
      '<button class="btn pri" id="bxInsight" style="flex:1">✨ 让这段光阴，自己开口</button>'+
      '<button class="btn" id="bxSave" style="flex:1">封存入宝盒</button></div>';
    $('#bxBody').innerHTML=s;
    $('#bxInsight').onclick=function(){boxInsight()};
    $('#bxSave').onclick=function(){
      var tx=$('#bxTxt').value.trim();if(!tx)return toast('写一句吧');
      DB.box=DB.box.filter(function(x){return x.date!==v});
      DB.box.push({id:uid(),date:v,text:tx});save();closeModal('mMod');toast('已封存 · '+cnDate(v));chime();
    };
  };
  $('#bxDate').onchange=render;render();
}

/* ============================================================
   设置（含隐私说明）
   ============================================================ */
function openSet(){
  var a=DB.ai;
  DB.vip=DB.vip||{plan:'trial',until:'',love:false,credits:0};
  var trialLeft=Math.max(0,7-daysBetween(DB.created,TODAY()));
  var vStat=DB.vip.plan==='month'?('月度会员中 · 有效期至 '+cnDate(DB.vip.until)):'免费体验中'+(trialLeft>0?' · 还剩 '+trialLeft+' 天':' · 体验已到期');
  if(DB.vip.love)vStat+=' · 恋爱副本已解锁';
  if(DB.vip.credits>0)vStat+=' · 报告机会 ×'+DB.vip.credits;
  var p=panel('<div class="ph">当铺后台</div><div class="pd">AI 由服务端统一配置（DEEPSEEK_API_KEY），<br>前端只接收生成结果；未配置时自动回落到内置模拟文案。</div>'+
    '<div class="box">'+
      '<div class="mini" style="margin-bottom:12px;color:var(--dim2)">Key 保存在服务端环境变量中，不会下发到浏览器，也无需在此填写。</div>'+
      '<div class="row" style="margin-bottom:12px">'+
        '<button class="btn" id="sTest">测试 AI 连接</button>'+
        '<button class="btn pri" id="sSave">保存</button></div>'+
      '<div class="mini" id="sTip">当前：AI 请求经服务端转发</div>'+
    '</div>'+
    '<div class="box" style="margin-top:12px;border-color:rgba(240,211,148,.35)">'+
      '<div class="sec-t" style="margin-bottom:8px">光阴会员 · 会员说明</div>'+
      '<div class="mini" style="margin-bottom:10px;color:var(--dim2)">以下为会员方案说明，仅作演示，未接入真实支付</div>'+
      '<table class="vip-tbl">'+
        '<tr><th>方案</th><th>价格</th><th>说明</th></tr>'+
        '<tr><td>新用户</td><td>免费 7 天</td><td>所有功能都能用 · 先完整体验</td></tr>'+
        '<tr><td>首月会员</td><td>3.99 元</td><td>不到一杯奶茶的价格，看看你的光阴去了哪里</td></tr>'+
        '<tr><td>月度会员</td><td>9.99 元 / 月</td><td>让光阴陪你走得更远 · 同等权益</td></tr>'+
        '<tr><td>按次报告</td><td>2.33 元 / 次</td><td>记录每一次心动的瞬间</td></tr>'+
        '<tr><td>我们的纪念</td><td>5.21 元</td><td>把我们的故事永远存进光阴里</td></tr>'+
      '</table>'+
    '</div>'+
    '<div class="box" style="margin-top:12px">'+
      '<div class="sec-t" style="margin-bottom:10px">其他</div>'+
      '<div class="row" style="margin-bottom:10px">'+
        '<button class="btn sm" id="sVoice">语音：'+(a.voice==='mock'?'模拟':'自动')+'</button>'+
        '<button class="btn sm" id="sSound">音效：'+(a.sound?'开':'关')+'</button></div>'+
      '<div class="row" style="margin-bottom:10px">'+
        '<button class="btn sm" id="sGuide">开业指引：'+(DB.guide!==false?'每次开铺弹出':'不再显示')+'</button>'+
        '<button class="btn sm" id="sCoach">重看开业指引</button></div>'+
      '<div class="mini" style="margin-bottom:6px">周预算（铜钱）</div>'+
      '<input class="inp" id="sBudget" type="number" value="'+(DB.budget.week||800)+'" style="margin-bottom:12px">'+
      '<div class="row"><button class="btn" id="sReseed">重置示例数据</button>'+
      '<button class="btn danger" id="sClear">清空一切</button></div>'+
    '</div>'+
    '<div class="box" style="margin-top:12px;border-color:rgba(240,211,148,.3)">'+
      '<div class="sec-t" style="margin-bottom:8px">隐私之诺</div>'+
      '<div class="mini" style="line-height:2.1">你记下的一切——光阴、铜钱、心绪、痴想、两个人的纪念——<b style="color:var(--gold);font-weight:400">只保存在这台设备的浏览器里（localStorage）</b>，不上传任何服务器，不参与任何统计。AI 请求由本站服务端转发至 DeepSeek，API Key 保存在服务端环境变量中，不会下发到浏览器。清空浏览器数据即彻底删除。</div>'+
    '</div>');
  $('#sSave').onclick=function(){
    DB.budget.week=parseFloat($('#sBudget').value)||800;
    save();toast('已保存');renderHome();if(activeSheet)closeSheet();
  };
  $('#sTest').onclick=function(){
    $('#sTip').textContent='正在连接…';
    fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({user:'回复两个字：正常',style:'default'})})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j}})})
      .then(function(x){$('#sTip').textContent=x.ok?('连接成功：'+(x.j.text||'OK')):('连接失败：'+((x.j&&x.j.message)||'服务端未配置 AI'))})
      .catch(function(e){$('#sTip').textContent='连接失败：'+e.message});
  };

  $('#sVoice').onclick=function(){DB.ai.voice=DB.ai.voice==='mock'?'auto':'mock';save();closeModal('mMod');openSet()};
  $('#sGuide').onclick=function(){DB.guide=DB.guide===false;save();closeModal('mMod');openSet();toast(DB.guide!==false?'引导页：每次开铺弹出':'不再显示引导页')};
  $('#sSound').onclick=function(){DB.ai.sound=!DB.ai.sound;save();closeModal('mMod');openSet()};
  $('#sCoach').onclick=function(){closeModal('mMod');startCoach()};
  $('#sReseed').onclick=function(){
    ask('重置示例数据','当前所有记录会被 21 天示例数据覆盖。','重置',true).then(function(y){if(y){DB=seed();save();closeModal('mMod');renderHome();renderMem();toast('已重置')}});
  };
  $('#sClear').onclick=function(){
    ask('清空一切记录','你在「光阴的故事」里存下的一切都会被抹去，不可恢复。','清空',true).then(function(y){
      if(y){DB=blank();save();closeModal('mMod');renderHome();renderMem();toast('一切归零')}});
  };
}

/* ============================================================
   星空 —— 闪烁的星 + 流星 + 暖星云
   ============================================================ */
(function(){
  var cv=$('#stars');if(!cv)return;
  var x=cv.getContext('2d'),st=[],met=[],W2,H2,DPR=Math.min(2,window.devicePixelRatio||1);
  function rs(){W2=cv.width=window.innerWidth*DPR;H2=cv.height=window.innerHeight*DPR;cv.style.width=window.innerWidth+'px';cv.style.height=window.innerHeight+'px'}
  function init(){
    st=[];var n=Math.min(170,Math.round(window.innerWidth*window.innerHeight/5200));
    for(var i=0;i<n;i++)st.push({
      x:Math.random(),y:Math.random(),r:Math.random()*1.3+.4,
      tw:Math.random()*.022+.006,ph:Math.random()*6.28,
      warm:Math.random()<.3,halo:Math.random()<.14});
  }
  function spawnMeteor(){
    met.push({x:Math.random()*.7+.15,y:Math.random()*.25,vy:.0035+Math.random()*.002,vx:.0018+Math.random()*.0012,life:1});
  }
  function loop(){
    x.clearRect(0,0,W2,H2);
    for(var i=0;i<st.length;i++){
      var s=st[i];s.ph+=s.tw;
      var al=.16+.62*Math.abs(Math.sin(s.ph));
      var rr=s.r*DPR;
      var col=s.warm?'255,236,200':'236,240,255';
      x.beginPath();x.arc(s.x*W2,s.y*H2,rr,0,6.2832);
      x.fillStyle='rgba('+col+','+al.toFixed(3)+')';x.fill();
      if(s.halo){x.beginPath();x.arc(s.x*W2,s.y*H2,rr*3.4,0,6.2832);
        x.fillStyle='rgba('+col+','+(al*.1).toFixed(3)+')';x.fill()}
    }
    for(var j=met.length-1;j>=0;j--){
      var m=met[j];
      m.x+=m.vx;m.y+=m.vy;m.life-=.014;
      if(m.life<=0){met.splice(j,1);continue}
      var tx=m.x*W2,ty=m.y*H2,len=90*DPR;
      var gr=x.createLinearGradient(tx,ty,tx-len,ty-len*.55);
      gr.addColorStop(0,'rgba(255,240,210,'+(m.life*.85).toFixed(3)+')');
      gr.addColorStop(1,'rgba(255,240,210,0)');
      x.strokeStyle=gr;x.lineWidth=1.6*DPR;x.lineCap='round';
      x.beginPath();x.moveTo(tx,ty);x.lineTo(tx-len,ty-len*.55);x.stroke();
    }
    if(Math.random()<.004&&met.length<2)spawnMeteor();
    if(!cv.isConnected)return;
    requestAnimationFrame(loop);
  }
  rs();init();loop();
  window.addEventListener('resize',function(){if(!cv.isConnected)return;rs();init()});
})();

/* ============================================================
   启动
   ============================================================ */
DB=load();save();
var __btnSet=$('#btnSet');if(__btnSet)__btnSet.onclick=openSet;
if(MODE==='home'){
  renderHome();renderMem();setDeck(0,true);
  var __gate=$('#gate');
  var __gateSeen=false;try{__gateSeen=sessionStorage.getItem('gsdg_gate_off')==='1'}catch(e){}
  if(__gate){if(__gateSeen){__gate.classList.add('off');__gate.style.display='none';}
  $('#gateGo').onclick=function(){chime();__gate.classList.add('off');try{sessionStorage.setItem('gsdg_gate_off','1')}catch(e){}maybeCoach()};}
}else{
  var __sheetMap={time:['sTime',renderTime],money:['sMoney',renderMoney],mood:['sMood',renderMood],dream:['sDream',renderDream]};
  var __m=__sheetMap[KIND];
  if(__m){
    if(OPTS.body!=='react')__m[1]();
    var __se=document.getElementById(__m[0]);if(__se)__se.classList.add('open');
  }
  if(KIND==='time'&&OPTS.ui&&OPTS.ui.time){
    OPTS.ui.time.statement=function(style){
      if(style)timeStyle=style;
      DB=load();
      genTimeStatement();
    };
  }
  if(KIND==='money'&&OPTS.ui&&OPTS.ui.money){
    OPTS.ui.money.statement=function(style){
      if(style)moneyStyle=style;
      DB=load();
      moneyStatement();
    };
  }
  if(KIND==='mood'&&OPTS.ui&&OPTS.ui.mood){
    OPTS.ui.mood.report=function(){
      DB=load();
      genMoodReport();
    };
  }
}

}
