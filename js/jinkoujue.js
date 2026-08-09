// ============ 金口诀排盘（按 kentang2017/kinjinkou 权威算法重写） ============
(function () {
  var Solar = window.Solar;
  var LunarUtil = window.LunarUtil;
  var SS = window.ShenShaData;
  var U = window.Utils;

  var GAN = '甲乙丙丁戊己庚辛壬癸';
  var ZHI = '子丑寅卯辰巳午未申酉戌亥';
  // 将神星名（子=神后...亥=登明）
  var JIANG_NAME = ['神后', '大吉', '功曹', '太冲', '天罡', '太乙', '胜光', '小吉', '传送', '从魁', '河魁', '登明'];
  // 贵神地支特殊顺序（贵人腾蛇朱雀六合勾陈青龙天空白虎太常玄武太阴天后）
  var GUI_DIZHI = '丑巳午卯辰寅戌申未子酉亥'.split('');
  var GUI_SHEN = ['贵人', '腾蛇', '朱雀', '六合', '勾陈', '青龙', '天空', '白虎', '太常', '玄武', '太阴', '天后'];
  // 果老星宗法 昼/夜贵人表（《果老星宗》/《六壬探源2》：天干两两成对）
  var GUI_REN_GUOLAO = {
    昼: { 甲: '未', 乙: '申', 丙: '酉', 丁: '亥', 戊: '午', 己: '子', 庚: '丑', 辛: '寅', 壬: '卯', 癸: '巳' },
    夜: { 甲: '丑', 乙: '子', 丙: '亥', 丁: '酉', 戊: '寅', 己: '申', 庚: '未', 辛: '午', 壬: '巳', 癸: '卯' }
  };
  // 神将释义（《金口诀入门与进阶》第六章第5节）
  var GUI_DESC = {
    贵人: '官贵之神，遇之易有当官的插手或本身为官。受克主诅咒仇害；受生有官贵之喜；囚主牢狱。',
    腾蛇: '惊异、惊怪、虚惊。不受克为文章喜美、公信、财帛酒食；受克主不正经女人、虚惊、病患、怀疑。',
    朱雀: '文字印信、口舌。不受克为文书、印信、权力、公侯；凶为口舌、惊恐、官司、虚诈、血光。',
    六合: '婚姻、交易、合作。不受克为婚姻、交易、求财、喜美庆会；受克为官司、损财、过失、交易不明。',
    勾陈: '勾连、斗争。不受克为官职（尤其武官）、有权；凶为官司争竞、勾连、走失。',
    青龙: '官贵、财喜。不受克为财喜、官职、文书、婚姻之喜；受克为穷苦、破财、官职有损。',
    天空: '虚假、走失、斗讼。不受克为僧人、考试吉利、权力之象；受克为虚假不实。',
    白虎: '伤亡、斗争。不受克为生意、武官、道路奔跑；受克为战争、凶丧。',
    太常: '酒食、婚姻、宴会。不受克为女人、酒食、婚姻、财物；受克为毒药、呕吐。',
    玄武: '欺骗、盗窃。不受克（旺）为聪明、见贵人得财；受克为偷盗、欺骗、死丧、破财。',
    太阴: '阴私。不受克为金银、钱物、阴私喜美荫佑；凶为奸淫、逃亡、迟滞、失财。',
    天后: '赏赐、冤枉、阴私喜美、良家。不受克为赏赐、征召、婚姻；受克为暗昧不明、奸淫。'
  };
  var JIANG_DESC = {
    登明: '征召、生气、婚姻', 河魁: '斗讼、骸骨、争竞', 从魁: '隐私、女人',
    传送: '奔跑、驿马', 小吉: '酒食、女人', 胜光: '信息、惊恐、财物',
    太乙: '惊怪、多言、是非、生气、招外婿', 天罡: '斗讼、战斗', 太冲: '财物、伤人、贼',
    功曹: '官事、手续、文章', 大吉: '诅咒', 神后: '妄想、奸淫、失望、贼'
  };
  // 神煞释义（《金口诀入门与进阶》第六章"神煞解释"）
  var SHEN_DESC = {
    天德: '课中见天德，主有贵人相助，在哪个位置表示哪类人帮你。',
    月德: '课中见月德，主有贵人相助，能解百祸。',
    天德合: '与天德相合之地支，能解百祸，但力量没天德大。',
    月德合: '与月德相合之地支，能解百祸，但力量没月德大。',
    天赦: '卦中见天赦，家中必有人常行善事或敬神佛；遇司法机关捉拿时最喜此神；测天气为晴天；测人运气表示做错事易被原谅。',
    三奇: '主奇遇、奇巧、贵人帮忙之事。甲戊庚与佛道司法领导有关、天时好；乙丙丁最管用、明显有人帮忙；壬癸辛为私下之义气人帮忙。',
    六丁六甲: '人元见甲为喜事、求职文书俱吉；人元见丁主惊吓、忧愁、惊恐不安。',
    驿马: '主快，见驿马为快；为官见之升迁。',
    天马: '比驿马更快更远；马星逢合则止；逢马星宜物流类职业。',
    劫煞: '主灾，速度极快；逢劫临什么表示什么灾；测病或生孩子临劫需手术。',
    灾煞: '主灾，与劫煞类似；疾病、六畜相关。',
    天罗: '非官灾即病灾；测事主不通之象。',
    地网: '非官灾即病灾；测事主不通之象。',
    关隔锁: '阻碍不通、关节不通、信息不灵；酉寅关、卯辰戌隔、卯申锁。',
    旬空: '吉凶不成、空想；近病逢空则愈，久病逢空则死。',
    四绝: '凶神、断绝；占病必死、占婚离异。',
    月破: '占忧逢月破反而为好事（否定之否定）；非占忧之事临月破为梦碎、有阻挡。',
    太岁: '吉凶参半；占官为好，常人反有官司牵连。',
    天盗: '自己不偷人也要被人偷；天盗见卯再有贼动百分百被偷；逢合则不为灾。',
    地煞: '一般为不顺利，有解则开始不顺利后来解决。',
    五鬼: '一般有神鬼作怪；也为穷神，遇五鬼常爱挥霍。',
    生气: '主新开拓、有前途；用旺临生气为事业新起。',
    死气: '主乐极生悲、走下坡路；用死临死气彻底没戏。',
    天喜: '主喜庆之事；占老年人病不好为喜丧。',
    天医: '主大医院、国家正规医院；用爻临天医病易愈。',
    地医: '指地方小医院或民营医院。',
    禄倒: '主丢官罢职、名誉损失；测病易死亡；测考试白考。',
    马倒: '主不顺。',
    禄神: '主有工资、吃国家工资钱，不一定是正式公务员。',
    丧门: '测工作表示要辞职或换部门；与死亡信息有关。',
    吊客: '占事表示此事落实不下来、吊着。',
    丧车: '指灵车，丧车克人元必死；有吉神救可九死一生。',
    四墓: '占病与此病跟风水有关、要改风水；占运气表示压抑。',
    三丘: '占病与此病跟风水有关、要改风水；占运气表示压抑如墓压顶。',
    病符: '必有疾病缠身，但不一定是大病；占事情表示旧事干扰。',
    桃花: '也为赌神、穷神；占事难成易败露、节外生枝；子午卯酉为桃花。',
    灭门: '占事表示没门、没有门路；最忌占婚姻与怀孕，遇之必流产离婚；也主口舌是非。',
    截命灾煞: '遇之见仇人、生产不顺、病危险。',
    日德: '日德入课解凶。',
    日禄: '禄神，主有俸禄。',
    解神: '解神与天解同入课，占病解除厄难。',
    天诏: '与天医同，主遇良医、恩诏之事，现指上级调令。',
    日鬼: '克日干之同性地支，凶神，主官非。',
    支鬼: '克日支之同性地支，凶神，主官非。',
    墓神: '用神入墓主暗昧、不通、不自由之命。',
    小耗: '主破耗，钱花了没起作用。',
    哭神: '主哭丧之事，如见水尤为凶。',
    天狱: '为国家监狱，如坐监狱；见勾陈与朱雀相配易被拘留。',
    往亡: '主行人有灾。',
    天鬼: '容易此事被鬼干扰，一般为冤死鬼或短命鬼。',
    天盘: '申临辰戌为天盘，入课主难以解脱。',
    地结: '申临巳亥为地结，入课主难以解脱。',
    飞魂: '主做恶梦、神魂不定。',
    丧魄: '主占病，凶。',
    游都: '游鲁入课均凶，尤其占出外，可能犯劫路之人或盗贼。',
    鲁都: '游都对冲，游鲁入课均凶，占出外恐有盗贼。',
    月厌: '最忌占病（连绵不绝）；平时占为唉声叹气；灾煞与月厌同现则灾难躲。',
    天目: '主占疾病和家宅，可能有神鬼作祟。',
    隔角: '主别扭；占夫妻关系主双方性格不同造成矛盾。',
    亡神: '亡神月厌加临，灾祸不好躲。',
    大祸: '与灭门相反，主祸事。',
    披头星: '主丧亡六亲。',
    红鸾: '婚姻之喜神。',
    官符: '占病符；占人有官职且容易是清官。',
    天解: '与解神同入课，占病解除厄难。',
    金神煞: '主破碎或白衣；占病与白虎相见大凶。'
  };
  // 地支方位
  var DIRECTION = { 子: '北', 丑: '东北', 寅: '东北', 卯: '东', 辰: '东南', 巳: '东南', 午: '南', 未: '西南', 申: '西南', 酉: '西', 戌: '西北', 亥: '西北' };
  // 五行相生（SHENG[a]=b 表示 a 生 b）与相克（KE[a]=b 表示 a 克 b）
  var SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  var KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  // 五子元遁（日干 → 子位起干序号，1=甲子）
  var WUZI = { 甲: 1, 己: 1, 乙: 3, 庚: 3, 丙: 5, 辛: 5, 丁: 7, 壬: 7, 戊: 9, 癸: 9 };

  // 新增神煞数据表
  var TAI_JI = { 甲: ['子', '午'], 乙: ['子', '午'], 丙: ['卯', '酉'], 丁: ['卯', '酉'], 戊: ['辰', '戌', '丑', '未'], 己: ['辰', '戌', '丑', '未'], 庚: ['寅', '亥'], 辛: ['寅', '亥'], 壬: ['巳', '申'], 癸: ['巳', '申'] };
  var GUO_YIN = { 甲: '戌', 乙: '亥', 丙: '丑', 丁: '寅', 戊: '丑', 己: '寅', 庚: '辰', 辛: '巳', 壬: '未', 癸: '申' };
  var CI_GUAN = { 甲: '巳', 乙: '午', 丙: '申', 丁: '亥', 戊: '申', 己: '亥', 庚: '寅', 辛: '卯', 壬: '午', 癸: '巳' };
  var FU_XING = { 甲: '寅', 乙: '丑', 丙: '子', 丁: '亥', 戊: '申', 己: '未', 庚: '午', 辛: '巳', 壬: '辰', 癸: '卯' };
  var DE_XIU = { 寅午戌: { de: ['丙', '丁'], xiu: ['戊', '己'] }, 申子辰: { de: ['壬', '癸'], xiu: ['甲', '乙'] }, 亥卯未: { de: ['甲', '乙'], xiu: ['壬', '癸'] }, 巳酉丑: { de: ['庚', '辛'], xiu: ['丙', '丁'] } };
  var HE_GAN = { 甲: '己', 乙: '庚', 丙: '辛', 丁: '壬', 戊: '癸', 己: '甲', 庚: '乙', 辛: '丙', 壬: '丁', 癸: '戊' };
  var LIU_PO = { 子: '酉', 丑: '辰', 寅: '亥', 卯: '午', 辰: '丑', 巳: '申', 午: '卯', 未: '戌', 申: '巳', 酉: '子', 戌: '未', 亥: '寅' };

  // 常用神煞（按《金口诀入门与进阶》第六章主表划分）
  var COMMON_SHEN = ['天德', '月德', '天德合', '月德合', '天赦', '驿马', '天马', '劫煞', '六丁六甲', '天罗', '地网', '关隔锁', '旬空', '四绝', '月破', '太岁', '天盗', '地煞', '五鬼', '生气', '死气', '天喜', '天医', '地医', '禄倒', '马倒', '丧门', '吊客', '丧车', '四墓', '三丘', '病符', '灾煞', '桃花', '灭门', '截命灾煞', '三奇'];

  // ============ 书版神煞数据表（《金口诀入门与进阶》） ============
  // 天德（月→见字，可为干或支）
  var TD_BY_MONTH = { 1: '丁', 2: '申', 3: '壬', 4: '辛', 5: '亥', 6: '甲', 7: '癸', 8: '寅', 9: '丙', 10: '乙', 11: '巳', 12: '庚' };
  // 月德（月支三合→干）
  var YD_BY_SANHE = { 寅: '丙', 午: '丙', 戌: '丙', 亥: '甲', 卯: '甲', 未: '甲', 申: '壬', 子: '壬', 辰: '壬', 巳: '庚', 酉: '庚', 丑: '庚' };
  var GAN_HE = { 甲: '己', 乙: '庚', 丙: '辛', 丁: '壬', 戊: '癸', 己: '甲', 庚: '乙', 辛: '丙', 壬: '丁', 癸: '戊' };
  var ZHI_HE = { 子: '丑', 丑: '子', 寅: '亥', 卯: '戌', 辰: '酉', 巳: '申', 午: '未', 未: '午', 申: '巳', 酉: '辰', 戌: '卯', 亥: '寅' };
  // 天赦（季→干支）
  var TIAN_SHE = { 寅: '戊寅', 卯: '戊寅', 辰: '戊寅', 巳: '甲午', 午: '甲午', 未: '甲午', 申: '戊申', 酉: '戊申', 戌: '戊申', 亥: '甲子', 子: '甲子', 丑: '甲子' };
  // 天马（月→支）
  var TIAN_MA = { 1: '午', 7: '午', 2: '申', 8: '申', 3: '戌', 9: '戌', 4: '子', 10: '子', 5: '寅', 11: '寅', 6: '辰', 12: '辰' };
  // 地煞（三合→支）
  var DI_SHA = { 寅: '辰', 午: '辰', 戌: '辰', 申: '戌', 子: '戌', 辰: '戌', 巳: '未', 酉: '未', 丑: '未', 亥: '丑', 卯: '丑', 未: '丑' };
  // 五鬼（日干→支）
  var WU_GUI = { 甲: ['巳', '午'], 己: ['巳', '午'], 乙: ['寅', '卯'], 庚: ['寅', '卯'], 丙: ['子', '丑'], 辛: ['子', '丑'], 丁: ['戌', '亥'], 壬: ['戌', '亥'], 戊: ['申', '酉'], 癸: ['申', '酉'] };
  // 生气（月支→支，对冲为死气）
  var SHENG_QI = { 寅: '子', 卯: '丑', 辰: '寅', 巳: '卯', 午: '辰', 未: '巳', 申: '午', 酉: '未', 戌: '申', 亥: '酉', 子: '戌', 丑: '亥' };
  // 天喜/天医（月支→支，对冲为地医；正月戌顺行）
  var TIAN_XI_YY = { 寅: '戌', 卯: '亥', 辰: '子', 巳: '丑', 午: '寅', 未: '卯', 申: '辰', 酉: '巳', 戌: '午', 亥: '未', 子: '申', 丑: '酉' };
  // 禄倒（年干→支）
  var LU_DAO = { 甲: '卯', 乙: '辰', 丙: '午', 丁: '未', 戊: '午', 己: '未', 庚: '酉', 辛: '戌', 壬: '子', 癸: '丑' };
  // 马倒（年支三合→支）
  var MA_DAO = { 寅: '酉', 午: '酉', 戌: '酉', 申: '卯', 子: '卯', 辰: '卯', 亥: '午', 卯: '午', 未: '午', 巳: '子', 酉: '子', 丑: '子' };
  // 丧车（季→支）
  var SANG_CHE = { 寅: '酉', 卯: '酉', 辰: '酉', 巳: '子', 午: '子', 未: '子', 申: '卯', 酉: '卯', 戌: '卯', 亥: '午', 子: '午', 丑: '午' };
  // 三丘四墓（月支→墓，对冲为丘）
  var SI_MU = { 寅: '未', 卯: '未', 辰: '未', 巳: '戌', 午: '戌', 未: '戌', 申: '丑', 酉: '丑', 戌: '丑', 亥: '辰', 子: '辰', 丑: '辰' };
  // 灭门（月支→支）：阳月逆3，阴月顺3
  var MIE_MEN = { 子: '酉', 寅: '亥', 辰: '丑', 午: '卯', 申: '巳', 戌: '未', 丑: '辰', 卯: '午', 巳: '申', 未: '戌', 酉: '子', 亥: '寅' };
  // 截命灾煞（日干→支）
  var JIE_MING = { 甲: ['申', '酉'], 己: ['申', '酉'], 乙: ['午', '未'], 庚: ['午', '未'], 丙: ['辰', '巳'], 辛: ['辰', '巳'], 丁: ['寅', '卯'], 壬: ['寅', '卯'], 戊: ['子', '丑'], 癸: ['子', '丑'] };
  // 日德（日干→支）
  var RI_DE = { 甲: '寅', 己: '寅', 乙: '申', 庚: '申', 丙: '巳', 辛: '巳', 戊: '巳', 癸: '巳', 丁: '亥', 壬: '亥' };
  // 日禄（日干→支）
  var RI_LU = { 甲: '寅', 乙: '卯', 丙: '巳', 戊: '巳', 丁: '午', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子' };
  // 解神（月→支）
  var JIE_SHEN = { 1: '申', 2: '申', 3: '戌', 4: '戌', 5: '子', 6: '子', 7: '寅', 8: '寅', 9: '辰', 10: '辰', 11: '午', 12: '午' };
  // 墓神（三合→墓）
  var MU_SHEN = { 寅: '戌', 午: '戌', 戌: '戌', 亥: '未', 卯: '未', 未: '未', 申: '辰', 子: '辰', 辰: '辰', 巳: '丑', 酉: '丑', 丑: '丑' };
  // 小耗（寅月从未顺行）
  var XIAO_HAO = { 寅: '未', 卯: '申', 辰: '酉', 巳: '戌', 午: '亥', 未: '子', 申: '丑', 酉: '寅', 戌: '卯', 亥: '辰', 子: '巳', 丑: '午' };
  // 哭神（季→支）
  var KU_SHEN = { 寅: '未', 卯: '未', 辰: '未', 巳: '戌', 午: '戌', 未: '戌', 申: '丑', 酉: '丑', 戌: '丑', 亥: '辰', 子: '辰', 丑: '辰' };
  // 天狱（季→支）
  var TIAN_YU = { 寅: '卯', 卯: '卯', 辰: '卯', 巳: '午', 午: '午', 未: '午', 申: '酉', 酉: '酉', 戌: '酉', 亥: '子', 子: '子', 丑: '子' };
  // 往亡（月→支）
  var WANG_WANG = { 1: '寅', 2: '巳', 3: '申', 4: '亥', 5: '卯', 6: '午', 7: '酉', 8: '子', 9: '辰', 10: '未', 11: '戌', 12: '丑' };
  // 天鬼（月→支）
  var TIAN_GUI = { 1: '酉', 5: '酉', 9: '酉', 2: '午', 6: '午', 10: '午', 3: '卯', 7: '卯', 11: '卯', 4: '子', 8: '子', 12: '子' };
  // 飞魂（正月起亥顺行）
  var FEI_HUN = { 寅: '亥', 卯: '子', 辰: '丑', 巳: '寅', 午: '卯', 未: '辰', 申: '巳', 酉: '午', 戌: '未', 亥: '申', 子: '酉', 丑: '戌' };
  // 丧魄（月→支）
  var SANG_PO = { 1: '未', 5: '未', 9: '未', 2: '辰', 6: '辰', 10: '辰', 3: '丑', 8: '丑', 11: '丑', 4: '戌', 7: '戌', 12: '戌' };
  // 游都（日干→支，对冲为鲁都）
  var YOU_DU = { 甲: '丑', 己: '丑', 乙: '子', 庚: '子', 丙: '寅', 辛: '寅', 丁: '巳', 壬: '巳', 戊: '申', 癸: '申' };
  // 月厌（正月戌逆序）
  var YUE_YAN = { 1: '戌', 2: '酉', 3: '申', 4: '未', 5: '午', 6: '巳', 7: '辰', 8: '卯', 9: '寅', 10: '丑', 11: '子', 12: '亥' };
  // 天目（季→支）
  var TIAN_MU = { 寅: '辰', 卯: '辰', 辰: '辰', 巳: '未', 午: '未', 未: '未', 申: '戌', 酉: '戌', 戌: '戌', 亥: '丑', 子: '丑', 丑: '丑' };
  // 亡神（三合→支）
  var WANG_SHEN = { 寅: '巳', 午: '巳', 戌: '巳', 亥: '寅', 卯: '寅', 未: '寅', 申: '亥', 子: '亥', 辰: '亥', 巳: '申', 酉: '申', 丑: '申' };
  // 大祸（与灭门相反）
  var DA_HUO = { 子: '卯', 寅: '巳', 辰: '未', 午: '酉', 申: '亥', 戌: '丑', 丑: '戌', 卯: '子', 巳: '寅', 未: '辰', 酉: '午', 亥: '申' };
  // 披头星（年支→支）
  var PI_TOU = { 子: '辰', 丑: '卯', 寅: '寅', 卯: '丑', 辰: '子', 巳: '亥', 午: '戌', 未: '酉', 申: '申', 酉: '未', 戌: '午', 亥: '巳' };
  // 天解（月支→支）
  var TIAN_JIE = { 寅: '申', 卯: '未', 辰: '午', 巳: '巳', 午: '辰', 未: '卯', 申: '寅', 酉: '丑', 戌: '子', 亥: '亥', 子: '戌', 丑: '酉' };
  // 金神煞（日支→支）
  var JIN_SHEN_SHA = { 子: '巳', 午: '巳', 卯: '酉', 酉: '酉', 寅: '酉', 申: '酉', 巳: '酉', 亥: '酉', 辰: '丑', 戌: '丑', 丑: '丑', 未: '丑' };
  // 四绝（成对）
  var SI_JUE = [['酉', '寅'], ['卯', '申'], ['午', '亥'], ['子', '巳']];
  // 关隔锁（破锁/毁隔/斩关 判断对）
  var GUAN_JIAN_SUO = [['酉', '寅', '关'], ['寅', '申', '斩关'], ['卯', '辰', '隔'], ['卯', '戌', '隔'], ['辰', '寅', '毁隔'], ['戌', '寅', '毁隔'], ['卯', '申', '锁'], ['申', '午', '破锁']];

  // ============ 天干化地支（干支通假·用户版） ============
  // 丙-午、丁-巳；戊己双值（辰/戌、丑/未）不按旬划分，直接两值都查
  var GAN_TO_ZHI_U = { 甲: '寅', 乙: '卯', 丙: '午', 丁: '巳', 戊: ['辰', '戌'], 己: ['丑', '未'], 庚: '申', 辛: '酉', 壬: '子', 癸: '亥' };
  // 地支六冲（与 ZHI_CHONG2 一致，此处全局化）
  var ZHI_CHONG = { 子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅', 卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳' };
  // 地支六害（子未 丑午 寅巳 卯辰 申亥 酉戌）
  var ZHI_HAI = { 子: '未', 未: '子', 丑: '午', 午: '丑', 寅: '巳', 巳: '寅', 卯: '辰', 辰: '卯', 申: '亥', 亥: '申', 酉: '戌', 戌: '酉' };
  // 地支相刑：寅巳申互刑、丑戌未互刑、子卯相刑、辰午酉亥自刑
  function zhiXing(a, b) {
    if (a === b) return '辰午酉亥'.indexOf(a) >= 0;                       // 自刑
    if ('寅巳申'.indexOf(a) >= 0 && '寅巳申'.indexOf(b) >= 0) return true; // 寅巳申三刑
    if ('丑戌未'.indexOf(a) >= 0 && '丑戌未'.indexOf(b) >= 0) return true; // 丑戌未三刑
    if ((a === '子' && b === '卯') || (a === '卯' && b === '子')) return true; // 子卯刑
    return false;
  }
  // 天干 → 化支数组（戊己返回两个候选）
  function ganToZhiList(gan) {
    var v = GAN_TO_ZHI_U[gan];
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
  }
  // 课内四位（人元化支 + 贵神 + 将神 + 地分）任取三支是否成三合局
  function sanHeAny() {
    var rl = ganToZhiList(ke.renyuan);
    var list = rl.concat([ke.gui.zhi, ke.jiang.zhi, ke.difen]);
    for (var i = 0; i < list.length; i++) {
      for (var j = i + 1; j < list.length; j++) {
        for (var k = j + 1; k < list.length; k++) {
          var wx = sanHeWX2(list[i], list[j], list[k]);
          if (wx) return { wx: wx, zs: [list[i], list[j], list[k]] };
        }
      }
    }
    return null;
  }
  // 人元化支与 神/将/方 任一六合（含双值戊己）
  function renyuanLiuHe() {
    var rl = ganToZhiList(ke.renyuan);
    var others = [ke.gui.zhi, ke.jiang.zhi, ke.difen];
    for (var i = 0; i < rl.length; i++) {
      for (var j = 0; j < others.length; j++) {
        if (ZHI_HE[rl[i]] === others[j] || ZHI_HE[others[j]] === rl[i]) return { gz: rl[i], o: others[j], pos: ['贵神', '将神', '地分'][j] };
      }
    }
    return null;
  }
  // 人元化支与 神/将/方 任一相冲
  function renyuanChong() {
    var rl = ganToZhiList(ke.renyuan);
    var others = [ke.gui.zhi, ke.jiang.zhi, ke.difen];
    for (var i = 0; i < rl.length; i++) {
      for (var j = 0; j < others.length; j++) {
        if (ZHI_CHONG[rl[i]] === others[j]) return { gz: rl[i], o: others[j], pos: ['贵神', '将神', '地分'][j] };
      }
    }
    return null;
  }
  // 人元化支与 神/将/方 任一相刑
  function renyuanXing() {
    var rl = ganToZhiList(ke.renyuan);
    var others = [ke.gui.zhi, ke.jiang.zhi, ke.difen];
    for (var i = 0; i < rl.length; i++) {
      for (var j = 0; j < others.length; j++) {
        if (zhiXing(rl[i], others[j])) return { gz: rl[i], o: others[j], pos: ['贵神', '将神', '地分'][j] };
      }
    }
    return null;
  }
  // 人元化支与 神/将/方 任一相害
  function renyuanHai() {
    var rl = ganToZhiList(ke.renyuan);
    var others = [ke.gui.zhi, ke.jiang.zhi, ke.difen];
    for (var i = 0; i < rl.length; i++) {
      for (var j = 0; j < others.length; j++) {
        if (ZHI_HAI[rl[i]] === others[j]) return { gz: rl[i], o: others[j], pos: ['贵神', '将神', '地分'][j] };
      }
    }
    return null;
  }
  // 人元化支是否落某支（课内他爻入人元化支之墓亦用此）
  function renyuanZhiHit(z) { return ganToZhiList(ke.renyuan).indexOf(z) >= 0; }

  // ============ 关隔锁（四位相邻定向：a上见b = 相邻、a在下、b在上） ============
  // 四位从下到上（内到外）：地分 → 将神 → 贵神 → 人元(化支)
  // 关=酉上见寅、隔=卯上见辰/戌、锁=卯上见申；斩关=酉寅申三连、毁隔=卯辰/戌寅三连、破锁=卯申午三连
  function guanGeSuo() {
    var base = [ke.difen, ke.jiang.zhi, ke.gui.zhi];
    var rl = ganToZhiList(ke.renyuan);
    var seqs = rl.length ? rl.map(function (r) { return base.concat([r]); }) : [base];
    function hasPair(a, b) {
      for (var s = 0; s < seqs.length; s++) { var q = seqs[s]; for (var i = 0; i < q.length - 1; i++) if (q[i] === a && q[i + 1] === b) return true; }
      return false;
    }
    function hasTriple(a, b, c) {
      for (var s = 0; s < seqs.length; s++) { var q = seqs[s]; for (var i = 0; i < q.length - 2; i++) if (q[i] === a && q[i + 1] === b && q[i + 2] === c) return true; }
      return false;
    }
    var names = [];
    if (hasPair('酉', '寅')) names.push('关');
    if (hasPair('卯', '辰') || hasPair('卯', '戌')) names.push('隔');
    if (hasPair('卯', '申')) names.push('锁');
    if (hasTriple('酉', '寅', '申')) names.push('斩关');
    if (hasTriple('卯', '辰', '寅') || hasTriple('卯', '戌', '寅')) names.push('毁隔');
    if (hasTriple('卯', '申', '午')) names.push('破锁');
    return names;
  }

  var _state = null;
  var _fenlei = [];

  function parseInput(v) {
    v = String(v || '').replace(/[^\d]/g, '');
    if (v.length < 4) return null;
    var year = parseInt(v.substr(0, 4), 10);
    var month = v.length >= 6 ? parseInt(v.substr(4, 2), 10) : 6;
    var day = v.length >= 8 ? parseInt(v.substr(6, 2), 10) : 1;
    var hour = v.length >= 10 ? parseInt(v.substr(8, 2), 10) : 12;
    var minute = v.length >= 12 ? parseInt(v.substr(10, 2), 10) : 0;
    try { return Solar.fromYmdHms(year, month, day, hour, minute, 0); } catch (e) { return null; }
  }

  // 中气换月将表（太阳过宫：某中气后至下一中气前用该将）
  var JIANG_BY_ZHONGQI = { '雨水': '亥', '春分': '戌', '谷雨': '酉', '小满': '申', '夏至': '未', '大暑': '午', '处暑': '巳', '秋分': '辰', '霜降': '卯', '小雪': '寅', '冬至': '丑', '大寒': '子' };

  // ===== 日缠校正：太阳地心视黄经 → 月将（移植自《月将推算_算法.py》） =====
  // 回归黄经以春分点为 0°，每 30° 一宫，边界即中气；与"逢中气换将"等价但按精确黄经。
  var JIANG_LAMBDA = [
    [330, '亥'], [0, '戌'], [30, '酉'], [60, '申'], [90, '未'], [120, '午'],
    [150, '巳'], [180, '辰'], [210, '卯'], [240, '寅'], [270, '丑'], [300, '子']
  ];
  function solarLambdaDeg(solar) {
    // lunar.js 的 getJulianDay 把北京时间当作 UTC，需减 8 小时转真 UTC（与算法.py 一致）
    var jd = solar.getJulianDay() - 8 / 24;
    var T = (jd - 2451545.0) / 36525.0;
    var L0 = (280.46646 + 36000.76983 * T) % 360;
    var M = (357.52911 + 35999.05029 * T) % 360;
    var Mr = M * Math.PI / 180;
    var C = (1.914602 - 0.004817 * T) * Math.sin(Mr)
      + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
      + 0.000289 * Math.sin(3 * Mr);
    var theta = L0 + C;
    var Om = (125.04 - 1934.136 * T) * Math.PI / 180;
    return ((theta - 0.00569 - 0.00478 * Math.sin(Om)) % 360 + 360) % 360;
  }
  function getMonthJiangBySolarLambda(solar) {
    var lam = solarLambdaDeg(solar);
    for (var i = 0; i < JIANG_LAMBDA.length; i++) {
      var s = JIANG_LAMBDA[i][0];
      if (s <= lam && lam < s + 30) return JIANG_LAMBDA[i][1];
    }
    return '亥';
  }
  // 月将按中气精确换将：取当前日期之前（含）最近的中气
  function getMonthJiangByZhongQi(lunar) {
    try {
      var table = lunar.getJieQiTable();
      var nowJd = lunar.getSolar().getJulianDay();
      var best = null, bestJd = -1;
      for (var name in JIANG_BY_ZHONGQI) {
        var item = table[name];
        if (!item || typeof item.getJulianDay !== 'function') continue;
        var jd = item.getJulianDay();
        if (jd <= nowJd && jd > bestJd) { bestJd = jd; best = name; }
      }
      if (best) return JIANG_BY_ZHONGQI[best];
      return '丑'; // 年初（1/1~大寒前）＝冬至后，丑将
    } catch (e) {
      return null;
    }
  }

  // ============ 金口诀四课（权威算法） ============
  function calcKe(solar, difen, customJiang) {
    var lunar = solar.getLunar();
    var bazi = lunar.getEightChar();
    bazi.setSect(1);
    var yearGan = bazi.getYearGan(), yearZhi = bazi.getYearZhi();
    var monthGan = bazi.getMonthGan(), monthZhi = bazi.getMonthZhi();
    var dayGan = bazi.getDayGan(), dayZhi = bazi.getDayZhi();
    var timeGan = bazi.getTimeGan(), timeZhi = bazi.getTimeZhi();

    var mz = ZHI.indexOf(monthZhi);
    var dz = ZHI.indexOf(dayZhi);
    var tz = ZHI.indexOf(timeZhi);
    var df = ZHI.indexOf(difen);

    // 1. 月将：自定义 12 将优先；'richen'=日缠校正（太阳躔度）；默认中气换将（太阳过宫）
    var yuejiang = (customJiang && ZHI.indexOf(customJiang) >= 0) ? customJiang : null;
    var yuejiangAuto = true;
    var yuejiangMethod = '中气';
    if (yuejiang) {
      yuejiangAuto = false;
      yuejiangMethod = '自定义';
    } else if (customJiang === 'richen') {
      yuejiang = getMonthJiangBySolarLambda(solar);
      yuejiangAuto = false;
      yuejiangMethod = '日缠校正';
    } else {
      yuejiang = getMonthJiangByZhongQi(lunar);
      if (!yuejiang) {
        // 兜底：月支公式（13 - 月支序）
        yuejiang = ZHI[(13 - mz) % 12];
      }
    }
    var yuejiangIdx = ZHI.indexOf(yuejiang);

    // 2. 起天盘（月将加时）
    var offset = ((yuejiangIdx - tz) % 12 + 12) % 12;
    var tianPan = [];
    var panJiang = []; // 天盘对应将神星名
    for (var i = 0; i < 12; i++) {
      tianPan[i] = ZHI[(i + offset) % 12];
      panJiang[i] = JIANG_NAME[(i + offset) % 12];
    }

    // 3. 将神 = 数到地分
    var jiangshen = tianPan[df];
    var jiangshenName = panJiang[df];

    // 4. 贵神：贵人位 + 顺逆行神盘
    var isDay = ['卯', '辰', '巳', '午', '未', '申'].indexOf(timeZhi) >= 0;
    var guiRen, isShun, guiRenMethod = '昼夜顺逆';
    var idx;
    if (_state && _state.guiren === 'guolao') {
      // 果老星宗法：果老贵人表 + 落宫定顺逆（贵人落地盘亥子丑寅卯辰顺、巳午未申酉戌逆）
      guiRen = GUI_REN_GUOLAO[isDay ? '昼' : '夜'][dayGan] || '丑';
      guiRenMethod = '果老·落宫';
      var luoGong = tianPan.indexOf(guiRen); // 天盘贵人所落地盘位
      if (luoGong < 0) luoGong = ZHI.indexOf(guiRen);
      idx = luoGong;
      isShun = '亥子丑寅卯辰'.indexOf(ZHI[idx]) >= 0;
    } else {
      // 默认（俗传）：昼夜顺逆
      if (['甲', '戊', '庚'].indexOf(dayGan) >= 0) guiRen = isDay ? '丑' : '未';
      else if (['乙', '己'].indexOf(dayGan) >= 0) guiRen = isDay ? '子' : '申';
      else if (['丙', '丁'].indexOf(dayGan) >= 0) guiRen = isDay ? '亥' : '酉';
      else if (['壬', '癸'].indexOf(dayGan) >= 0) guiRen = isDay ? '巳' : '卯';
      else guiRen = isDay ? '午' : '寅'; // 辛：昼贵午、夜贵寅（金口诀"六辛逢马虎"，虎寅马午）
      isShun = (isDay && ['壬', '癸', '辛'].indexOf(dayGan) < 0) || (!isDay && ['壬', '癸', '辛'].indexOf(dayGan) >= 0);
      idx = ZHI.indexOf(guiRen);
    }
    // 贵神地支映射（天后设置：金口诀默认天后亥/玄武子；大六壬天后子/玄武亥）
    var guiDizhi = ['丑', '巳', '午', '卯', '辰', '寅', '戌', '申', '未', '子', '酉', '亥'];
    if (_state && _state.tianhou === '子') { guiDizhi[9] = '亥'; guiDizhi[11] = '子'; }
    var shenPan = new Array(12);
    for (var s = 1; s <= 12; s++) {
      var key;
      if (isShun) {
        if (idx + s >= 13) idx -= 12;
        key = idx + s;
      } else {
        if (idx - s + 2 <= 0) idx += 12;
        key = idx - s + 2;
      }
      shenPan[key - 1] = guiDizhi[s - 1];
    }
    var guishen = shenPan[df];
    var guishenName = GUI_SHEN[guiDizhi.indexOf(guishen)];

    // 5. 五子元遁（日干起）→ 人元（只干）/ 将神干 / 贵神干
    var ss = WUZI[dayGan];
    function ganFromZhi(zhiIdx) {
      return GAN[((zhiIdx + ss - 1) % 10 + 10) % 10];
    }
    var renyuan = ganFromZhi(df);
    var jianggan = ganFromZhi(ZHI.indexOf(jiangshen));
    var shengan = ganFromZhi(ZHI.indexOf(guishen));

    // 6. 旺衰（课内五行生克定旺）
    var wangShuai = calcWangShuai([renyuan, guishen, jiangshen, difen]);

    // 7. 用神（阴阳）
    var yongShen = calcYongShen([renyuan, guishen, jiangshen, difen]);

    // 8. 四大空亡（日柱纳音）
    var sidakongwang = calcSiDaKongWang(dayGan + dayZhi);

    return {
      difen: difen, difenDir: DIRECTION[difen],
      zhanshi: timeZhi,
      yuejiang: yuejiang,
      yuejiangAuto: yuejiangAuto,
      yuejiangMethod: yuejiangMethod,
      renyuan: renyuan,
      renyuanWX: U.wuXingMap(renyuan),
      renyuanYY: '阳阴'.charAt(GAN.indexOf(renyuan) % 2),
      renyuanZhi: ganToZhiList(renyuan),
      gui: { gan: shengan, zhi: guishen, ganzhi: shengan + guishen, shen: guishenName, wx: U.wuXingMap(guishen), yy: '阳阴'.charAt(ZHI.indexOf(guishen) % 2) },
      jiang: { gan: jianggan, zhi: jiangshen, ganzhi: jianggan + jiangshen, name: jiangshenName, wx: U.wuXingMap(jiangshen), yy: '阳阴'.charAt(ZHI.indexOf(jiangshen) % 2) },
      difenWX: U.wuXingMap(difen),
      difenYY: '阳阴'.charAt(df % 2),
      wangShuai: wangShuai,
      yongShen: yongShen,
      sidakongwang: sidakongwang,
      isDay: isDay, guiRen: guiRen, isShun: isShun, guiRenMethod: guiRenMethod,
      tianPan: tianPan, panJiang: panJiang, shenPan: shenPan,
      bazi: { yearGan: yearGan, yearZhi: yearZhi, monthGan: monthGan, monthZhi: monthZhi, dayGan: dayGan, dayZhi: dayZhi, timeGan: timeGan, timeZhi: timeZhi },
      idx: { mz: mz, dz: dz, tz: tz, df: df }
    };
  }

  // 旺衰（参考《金口诀旺衰判断》图片规则：课内四位人元干/贵神支/将神支/地分支的五行判断）
  // 1. 四种五行齐全 → 不受克为旺（缺的五行所克者旺，如缺土→水不被土克→水旺）
  // 2. 三种五行(2+1+1) → 克他爻为旺（课内实际存在的克关系中克者旺）
  // 3. 两种五行(3+1) → 多者为旺（一个五行出三次，此五行最旺，无视生克）
  // 4. 两种五行(2+2) → 克关系取克者旺；生关系取受生者旺
  // 5. 一种五行 → 该五行旺
  function calcWangShuai(gzList) {
    var wxs = gzList.map(function (g) { return U.wuXingMap(g); });
    var cnt = {};
    wxs.forEach(function (w) { cnt[w] = (cnt[w] || 0) + 1; });
    var present = Object.keys(cnt);
    var wang = null;
    // 判断 w 是否被课内其他五行克制
    function isKeBy(w) {
      for (var i = 0; i < present.length; i++) {
        if (present[i] !== w && KE[present[i]] === w) return true;
      }
      return false;
    }
    // 课内存在的克关系中的克者集合
    function keZhe() {
      var out = [];
      for (var i = 0; i < present.length; i++) {
        for (var j = 0; j < present.length; j++) {
          if (i !== j && KE[present[i]] === present[j]) { out.push(present[i]); break; }
        }
      }
      return out;
    }
    if (present.length === 4) {
      // 不受克为旺：唯一没有被课内五行克到的
      var unKe = present.filter(function (w) { return !isKeBy(w); });
      wang = unKe[0] || present[0];
    } else if (present.length === 3) {
      // 克他爻为旺
      var kers = keZhe();
      if (kers.length === 1) {
        wang = kers[0];
      } else if (kers.length > 1) {
        // 多个克者：优先取自身不受克者，再取成对者，再取数量多者
        var unKe2 = kers.filter(function (x) { return !isKeBy(x); });
        if (unKe2.length === 1) wang = unKe2[0];
        else if (unKe2.length > 1) {
          var pair2 = unKe2.filter(function (x) { return cnt[x] >= 2; });
          wang = pair2[0] || unKe2[0];
        } else {
          var pair3 = kers.filter(function (x) { return cnt[x] >= 2; });
          wang = pair3[0] || kers[0];
        }
      } else {
        // 无克关系（不常见）：取成对的五行
        var pair = present.filter(function (x) { return cnt[x] >= 2; });
        wang = pair[0] || present[0];
      }
    } else if (present.length === 2) {
      var a = present[0], b = present[1];
      if (cnt[a] >= 3 || cnt[b] >= 3) {
        // 3+1：多者为旺（无视生克）
        wang = cnt[a] >= 3 ? a : b;
      } else {
        // 2+2 二对：克关系→克者旺；生关系→受生者旺
        if (KE[a] === b) wang = a;
        else if (KE[b] === a) wang = b;
        else if (SHENG[a] === b) wang = b;
        else if (SHENG[b] === a) wang = a;
        else wang = a;
      }
    } else {
      wang = present[0]; // 一种五行
    }
    // 旺相休囚死（旺=最旺者、相=旺所生、休=生旺者、囚=克旺者、死=旺所克）
    var res = {};
    wxs.forEach(function (w, idx) {
      var g = gzList[idx];
      if (w === wang) res[g] = '旺';
      else if (SHENG[wang] === w) res[g] = '相';
      else if (SHENG[w] === wang) res[g] = '休';
      else if (KE[wang] === w) res[g] = '死';
      else if (KE[w] === wang) res[g] = '囚';
      else res[g] = '';
    });
    res.wang = wang;
    return res;
  }

  // 用神（阴阳）
  function calcYongShen(gzList) {
    var yys = gzList.map(function (g) { return '阳阴'.charAt((GAN.indexOf(g) >= 0 ? GAN.indexOf(g) : ZHI.indexOf(g)) % 2); });
    var yang = 0;
    yys.forEach(function (y) { if (y === '阳') yang++; });
    if (yang === 0) return '将神';
    if (yang === 1) { var i = yys.indexOf('阳'); return ['人元', '贵神', '将神', '地分'][i]; }
    if (yang === 2) return '将神';
    if (yang === 3) { var j = yys.indexOf('阴'); return ['人元', '贵神', '将神', '地分'][j]; }
    return '贵神';
  }

  // 四大空亡（日柱纳音旬）
  function calcSiDaKongWang(dayGZ) {
    var jiazi = LunarUtil.JIA_ZI || [];
    var n = jiazi.indexOf(dayGZ) + 1; // 1-60
    if (n < 1) n = 1;
    if ((n >= 1 && n <= 10) || (n >= 31 && n <= 40)) return '水';
    if ((n >= 21 && n <= 30) || (n >= 51 && n <= 60)) return '金';
    return '无';
  }

  // ============ 神煞计算 ============
  var P = [], P_COMMON = [], P_RARE = [];
  var ke = null;
  function resetP() { P = []; P_COMMON = []; P_RARE = []; }
  function isCommon(name) { return COMMON_SHEN.indexOf(name) >= 0; }
  function hitGanArr(arr) {
    var list = [ke.bazi.yearGan, ke.bazi.monthGan, ke.bazi.dayGan, ke.bazi.timeGan, ke.renyuan, ke.gui.gan, ke.jiang.gan];
    var pos = ['年干', '月干', '日干', '时干', '人元', '贵神', '将神'];
    var found = [];
    for (var i = 0; i < list.length; i++) { for (var j = 0; j < arr.length; j++) { if (list[i] === arr[j]) { found.push(pos[i]); break; } } }
    return found;
  }
  function hitZhiArr(arr) {
    var list = [ke.bazi.yearZhi, ke.bazi.monthZhi, ke.bazi.dayZhi, ke.bazi.timeZhi, ke.difen, ke.jiang.zhi, ke.gui.zhi];
    var pos = ['年支', '月支', '日支', '时支', '地分', '将神', '贵神'];
    var found = [];
    for (var i = 0; i < list.length; i++) { for (var j = 0; j < arr.length; j++) { if (list[i] === arr[j]) { found.push(pos[i]); break; } } }
    return found;
  }
  function hitStr(found) { return found.length ? '✓' + found.join('、') : ''; }
  function push(name, tag, val, hit, hitArr) {
    var item = { name: name, tag: tag, val: val, hit: hit || '', hitArr: hitArr || [] };
    P.push(item);
    if (isCommon(name)) P_COMMON.push(item); else P_RARE.push(item);
  }
  function pushZhi(name, tag, zhiArr, src) {
    var arr = Array.isArray(zhiArr) ? zhiArr : [zhiArr];
    var found = hitZhiArr(arr);
    push(name, tag, arr.join('、') + '（' + src + '）', hitStr(found), found);
  }
  function pushGan(name, tag, ganArr, src) {
    var arr = Array.isArray(ganArr) ? ganArr : [ganArr];
    var found = hitGanArr(arr);
    push(name, tag, arr.join('、') + '（' + src + '）', hitStr(found), found);
  }
  function pushRizhu(name, tag, ok, dayGZ, listStr) {
    push(name, tag, ok ? '✓ ' + dayGZ + ' 入格' : '— ' + dayGZ + ' 不入格' + (listStr ? '（' + listStr + '）' : ''), '', []);
  }
  function yiMaZhi(map, name) {
    if (!map) return '';
    for (var k in map) if (map[k] === name) return k;
    return '';
  }
  function keGans() { return [ke.bazi.yearGan, ke.bazi.monthGan, ke.bazi.dayGan, ke.bazi.timeGan, ke.renyuan, ke.gui.gan, ke.jiang.gan]; }
  function keZhis() { return [ke.bazi.yearZhi, ke.bazi.monthZhi, ke.bazi.dayZhi, ke.bazi.timeZhi, ke.difen, ke.jiang.zhi]; }
  function hitGZ(gz) { var g = gz.substr(0, 1), z = gz.substr(1, 1); return keGans().indexOf(g) >= 0 && keZhis().indexOf(z) >= 0; }
  function pushGZ(name, tag, gz, src) { if (GAN.indexOf(gz) >= 0) pushGan(name, tag, gz, src); else pushZhi(name, tag, gz, src); }

  function calcShenSha() {
    resetP();
    var b = ke.bazi;
    var dayGZ = b.dayGan + b.dayZhi;
    var sanHeY = SS.sanHe[b.yearZhi];
    var sanHeD = SS.sanHe[b.dayZhi];
    var yiMaY = SS.yiMa[sanHeY] || {};
    var yiMaD = SS.yiMa[sanHeD] || {};
    var mzhi = b.monthZhi, mzNum = ZHI.indexOf(mzhi) + 1; // 月支→月数（寅=1）
    var zArr4 = [ke.gui.zhi, ke.jiang.zhi, ke.difen];   // 课内三位地支（贵神/将神/地分）
    var zArrAll = [b.yearZhi, b.monthZhi, b.dayZhi, b.timeZhi, ke.difen, ke.jiang.zhi];

    // ============ 常用神煞（《金口诀入门与进阶》主表） ============
    // 天德（书版：月→干或支）
    var td = TD_BY_MONTH[mzNum];
    if (td) pushGZ('天德', '吉', td, mzhi + '月见' + td);
    // 月德
    var yds = YD_BY_SANHE[mzhi];
    if (yds) pushGan('月德', '吉', yds, mzhi + '月（三合' + sanHeY + '）见' + yds);
    // 天德合 / 月德合
    if (td) { var tdHe = GAN.indexOf(td) >= 0 ? HE_GAN[td] : (ZHI_HE[td] || ''); if (tdHe) pushGZ('天德合', '吉', tdHe, '天德' + td + '之合'); }
    if (yds) pushGan('月德合', '吉', HE_GAN[yds] || '', '月德' + yds + '之合');
    // 天赦
    var tshe = TIAN_SHE[mzhi];
    if (tshe) push('天赦', '吉', tshe + '（' + mzhi + '月）', hitGZ(tshe) ? '✓课内见' + tshe : '');
    // 驿马
    pushZhi('驿马', '吉', [yiMaZhi(yiMaY, '驿马'), yiMaZhi(yiMaD, '驿马')].filter(Boolean), '年/日支');
    // 天马
    var tma = TIAN_MA[mzNum];
    if (tma) pushZhi('天马', '吉', tma, mzhi + '月见' + tma);
    // 劫煞
    pushZhi('劫煞', '凶', yiMaZhi(yiMaY, '劫煞'), '三合' + sanHeY);
    // 六丁六甲（人元）
    if (ke.renyuan === '甲') push('六丁六甲', '吉', '人元见甲，主喜事、求职文书俱吉', '✓人元甲');
    if (ke.renyuan === '丁') push('六丁六甲', '凶', '人元见丁，主忧愁、惊恐不安', '✓人元丁');
    // 天罗地网（含四位检测：四位/人元化支见戌亥为天罗、辰巳为地网，仅在命中位置显示）
    var rlAll = ganToZhiList(ke.renyuan);
    var tianLuo = (b.dayZhi === '戌' || b.dayZhi === '亥' || b.yearZhi === '戌' || b.yearZhi === '亥') || rlAll.indexOf('戌') >= 0 || rlAll.indexOf('亥') >= 0 || zArr4.indexOf('戌') >= 0 || zArr4.indexOf('亥') >= 0;
    var diWang = (b.dayZhi === '辰' || b.dayZhi === '巳' || b.yearZhi === '辰' || b.yearZhi === '巳') || rlAll.indexOf('辰') >= 0 || rlAll.indexOf('巳') >= 0 || zArr4.indexOf('辰') >= 0 || zArr4.indexOf('巳') >= 0;
    var WEI_POS = [['地分', ke.difen], ['将神', ke.jiang.zhi], ['贵神', ke.gui.zhi]];
    rlAll.forEach(function (z) { WEI_POS.push(['人元', z]); });
    var tlHit = WEI_POS.filter(function (t) { return t[1] === '戌' || t[1] === '亥'; }).map(function (t) { return t[0]; });
    var dwHit = WEI_POS.filter(function (t) { return t[1] === '辰' || t[1] === '巳'; }).map(function (t) { return t[0]; });
    push('天罗', tianLuo ? '凶' : '杂', tianLuo ? '✓ 日/年支或课内见戌亥' : '—（戌亥为天罗）', tlHit.length ? '✓' : '', tlHit);
    push('地网', diWang ? '凶' : '杂', diWang ? '✓ 日/年支或课内见辰巳' : '—（辰巳为地网）', dwHit.length ? '✓' : '', dwHit);
    // 关隔锁（四位相邻定向：酉上见寅关/卯上见辰戌隔/卯上见申锁；斩关毁隔破锁为解）
    var gls = guanGeSuo();
    if (gls.length) push('关隔锁', '凶', '✓课内' + gls.join('、'), '✓');
    else push('关隔锁', '杂', '酉寅关/卯辰戌隔/卯申锁（斩关·毁隔·破锁为解）', '');
    // 旬空
    var kongWang = U.xunKong(dayGZ);
    pushZhi('旬空', '凶', [kongWang.substr(0, 1), kongWang.substr(1, 1)], '日柱' + dayGZ + '旬空');
    // 四绝
    var sjHit = [];
    for (var sj = 0; sj < SI_JUE.length; sj++) { var p3 = SI_JUE[sj]; if (zArrAll.indexOf(p3[0]) >= 0 && zArrAll.indexOf(p3[1]) >= 0) sjHit.push(p3[0] + p3[1] + '绝'); }
    if (sjHit.length) push('四绝', '凶', '✓课内' + sjHit.join('、'), '✓');
    else push('四绝', '杂', '酉寅金绝/卯申木绝/午亥火绝/子巳水绝', '');
    // 月破
    pushZhi('月破', '凶', ZHI_HE[mzhi] || '', '月支' + mzhi + '之冲');
    // 太岁
    pushZhi('太岁', '杂', b.yearZhi, '年支入课');
    // 天盗
    var tdPos = [];
    if (zArr4.indexOf('子') >= 0) tdPos.push('子');
    ['卯', '酉', '亥'].forEach(function (z) { if (zArr4.indexOf(z) >= 0) tdPos.push(z); });
    if (tdPos.length) push('天盗', '凶', '✓课内' + tdPos.join('、'), '✓');
    else push('天盗', '杂', '课内见子水、卯酉亥为天盗', '');
    // 地煞
    pushZhi('地煞', '凶', DI_SHA[sanHeY] || '', '三合' + sanHeY);
    // 五鬼
    pushZhi('五鬼', '凶', WU_GUI[b.dayGan] || [], '日干' + b.dayGan);
    // 生气死气
    var sq = SHENG_QI[mzhi];
    if (sq) { pushZhi('生气', '吉', sq, mzhi + '月生气'); pushZhi('死气', '凶', ZHI_HE[sq] || '', mzhi + '月死气'); }
    // 天喜（书版）
    pushZhi('天喜', '吉', TIAN_XI_YY[mzhi] || '', mzhi + '月见');
    // 天医地医
    var tyi = TIAN_XI_YY[mzhi];
    if (tyi) { pushZhi('天医', '吉', tyi, mzhi + '月天医'); pushZhi('地医', '吉', ZHI_HE[tyi] || '', mzhi + '月地医'); }
    // 禄倒马倒
    var ldao = LU_DAO[b.yearGan]; if (ldao) pushZhi('禄倒', '凶', ldao, '年干' + b.yearGan);
    var mdao = MA_DAO[b.yearZhi]; if (mdao) pushZhi('马倒', '凶', mdao, '年支' + b.yearZhi);
    // 丧门吊客 / 丧车
    pushZhi('丧门', '凶', SS.sangMen[b.yearZhi] || '', '年支' + b.yearZhi);
    pushZhi('吊客', '凶', SS.diaoKe[b.yearZhi] || '', '年支' + b.yearZhi);
    pushZhi('丧车', '凶', SANG_CHE[mzhi] || '', mzhi + '月');
    // 三丘四墓
    var sm = SI_MU[mzhi];
    if (sm) { pushZhi('四墓', '凶', sm, mzhi + '月墓'); pushZhi('三丘', '凶', ZHI_HE[sm] || '', mzhi + '月丘'); }
    // 病符 / 灾煞 / 桃花
    pushZhi('病符', '凶', SS.bingFu[b.yearZhi] || '', '年支后一位');
    pushZhi('灾煞', '凶', yiMaZhi(yiMaY, '灾煞'), '三合' + sanHeY);
    pushZhi('桃花', '杂', SS.taoHua[sanHeY] || SS.taoHua[sanHeD] || '', '三合' + sanHeY);
    // 用神桃花：以用神支推桃花支，桃花支入四位（贵神/将神/地分）则算
    var TAO_HUA_Z = { 寅: '卯', 午: '卯', 戌: '卯', 申: '酉', 子: '酉', 辰: '酉', 亥: '子', 卯: '子', 未: '子', 巳: '午', 酉: '午', 丑: '午' };
    var yongZhi = ({ 人元: ke.renyuan, 贵神: ke.gui.zhi, 将神: ke.jiang.zhi, 地分: ke.difen })[ke.yongShen];
    var yongTH = TAO_HUA_Z[yongZhi];
    if (yongTH && zArr4.indexOf(yongTH) >= 0) pushZhi('用神桃花', '杂', yongTH, '用神' + yongZhi + '之桃花');
    // 灭门
    pushZhi('灭门', '凶', MIE_MEN[mzhi] || '', mzhi + '月');
    // 截命灾煞
    pushZhi('截命灾煞', '凶', JIE_MING[b.dayGan] || [], '日干' + b.dayGan);
    // 三奇
    var gans = [b.yearGan, b.monthGan, b.dayGan, b.timeGan];
    var shen3 = '';
    for (var i = 0; i <= 1; i++) {
      if (gans[i] + gans[i + 1] + gans[i + 2] === '甲戊庚') shen3 = '天上三奇';
      if (gans[i] + gans[i + 1] + gans[i + 2] === '乙丙丁') shen3 = '地下三奇';
      if (gans[i] + gans[i + 1] + gans[i + 2] === '壬癸辛') shen3 = '人中三奇';
    }
    push('三奇', shen3 ? '吉' : '杂', shen3 || '无（甲戊庚/乙丙丁/壬癸辛）', shen3 ? '✓四柱连见' : '');

    // ============ 不常见神煞（书补充 + 八字神煞） ============
    // 书补充神煞
    var rde = RI_DE[b.dayGan]; if (rde) pushZhi('日德', '吉', rde, '日干' + b.dayGan);
    var zde = ZHI[(ZHI.indexOf(b.dayZhi) + 5) % 12]; pushZhi('支德', '吉', zde, '日支前五辰');
    var rlu = RI_LU[b.dayGan]; if (rlu) pushZhi('日禄', '吉', rlu, '日干' + b.dayGan);
    var js2 = JIE_SHEN[mzNum]; if (js2) pushZhi('解神', '吉', js2, mzhi + '月');
    if (tyi) pushZhi('天诏', '吉', tyi, '与天医同');
    var riGui = '';
    var ganWX = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
    var zhiWX = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
    var KE = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' };
    var dayGanWX = ganWX[b.dayGan];
    // 日鬼：克日干之同性地支
    for (var rz = 0; rz < ZHI.length; rz++) { var z0 = ZHI[rz]; if (KE[zhiWX[z0]] === dayGanWX) { riGui = z0; break; } }
    if (riGui) pushZhi('日鬼', '凶', riGui, '克日干' + b.dayGan + '之支');
    // 支鬼：克日支之同性地支
    var zhiGui = '';
    for (var rz2 = 0; rz2 < ZHI.length; rz2++) { var z1 = ZHI[rz2]; if (KE[zhiWX[z1]] === zhiWX[b.dayZhi]) { zhiGui = z1; break; } }
    if (zhiGui) pushZhi('支鬼', '凶', zhiGui, '克日支' + b.dayZhi + '之支');
    // 墓神
    pushZhi('墓神', '凶', MU_SHEN[sanHeY] || '', '三合' + sanHeY + '之墓');
    // 小耗
    pushZhi('小耗', '凶', XIAO_HAO[mzhi] || '', mzhi + '月');
    // 哭神（如见水）
    var ksh = KU_SHEN[mzhi]; if (ksh) pushZhi('哭神', '凶', ksh, mzhi + '月（见水尤凶）');
    // 天狱
    pushZhi('天狱', '凶', TIAN_YU[mzhi] || '', mzhi + '月');
    // 往亡
    pushZhi('往亡', '凶', WANG_WANG[mzNum] || '', mzhi + '月');
    // 天鬼
    pushZhi('天鬼', '凶', TIAN_GUI[mzNum] || '', mzhi + '月');
    // 天盘地结（申临辰戌为天盘，临巳亥为地结）
    if (zArr4.indexOf('申') >= 0) {
      if (zArr4.indexOf('辰') >= 0 || zArr4.indexOf('戌') >= 0) push('天盘', '凶', '✓申临辰戌', '✓');
      if (zArr4.indexOf('巳') >= 0 || zArr4.indexOf('亥') >= 0) push('地结', '凶', '✓申临巳亥', '✓');
    } else push('天盘地结', '杂', '申临辰戌为天盘、临巳亥为地结', '');
    // 飞魂
    pushZhi('飞魂', '凶', FEI_HUN[mzhi] || '', mzhi + '月');
    // 丧魄
    pushZhi('丧魄', '凶', SANG_PO[mzNum] || '', mzhi + '月');
    // 游都/鲁都
    var yd2 = YOU_DU[b.dayGan];
    if (yd2) { pushZhi('游都', '凶', yd2, '日干' + b.dayGan); pushZhi('鲁都', '凶', ZHI_HE[yd2] || '', '游都对冲'); }
    // 月厌
    pushZhi('月厌', '凶', YUE_YAN[mzNum] || '', mzhi + '月');
    // 天目
    pushZhi('天目', '凶', TIAN_MU[mzhi] || '', mzhi + '月');
    // 隔角
    var geJiaoHit = '';
    var gePairs = ['丑寅', '辰巳', '戌亥', '未申'];
    for (var ge = 0; ge < gePairs.length; ge++) { var p = gePairs[ge]; if (zArrAll.indexOf(p[0]) >= 0 && zArrAll.indexOf(p[1]) >= 0) { geJiaoHit = '✓ ' + p; break; } }
    push('隔角', geJiaoHit ? '凶' : '杂', geJiaoHit || '—（丑寅/辰巳/戌亥/未申）', geJiaoHit ? '✓' : '');
    // 亡神
    pushZhi('亡神', '凶', WANG_SHEN[sanHeY] || '', '三合' + sanHeY);
    // 大祸
    pushZhi('大祸', '凶', DA_HUO[mzhi] || '', mzhi + '月');
    // 披头星
    pushZhi('披头星', '凶', PI_TOU[b.yearZhi] || '', '年支' + b.yearZhi);
    // 红鸾
    pushZhi('红鸾', '吉', SS.hongLuan[b.yearZhi] || '', '年支' + b.yearZhi);
    // 官符（甲戊庚日昼未夜丑）
    if ('甲戊庚'.indexOf(b.dayGan) >= 0) {
      var gf = (b.timeZhi >= '巳' && b.timeZhi <= '申') ? '未' : '丑';
      pushZhi('官符', '凶', gf, '甲戊庚日昼未夜丑');
    }
    // 天解
    pushZhi('天解', '吉', TIAN_JIE[mzhi] || '', mzhi + '月');
    // 金神煞
    pushZhi('金神煞', '凶', JIN_SHEN_SHA[b.dayZhi] || '', '日支' + b.dayZhi);

    // ============ 人元化支神煞（干支通假·用户版，人元化支纳入判断） ============
    var rlz = ganToZhiList(ke.renyuan);
    if (rlz.length) {
      var kwStr = kongWang || '';
      var rlKong = rlz.filter(function (z) { return kwStr.indexOf(z) >= 0; });
      if (rlKong.length) push('人元化空', '凶', '人元' + ke.renyuan + '化' + rlKong.join('/') + '落旬空，主事虚、人元之事难成', '✓人元化支', ['人元']);
      var yiMaList2 = [yiMaZhi(yiMaY, '驿马'), yiMaZhi(yiMaD, '驿马')].filter(Boolean);
      var rlMa = rlz.filter(function (z) { return yiMaList2.indexOf(z) >= 0; });
      if (rlMa.length) push('人元化驿马', '吉', '人元' + ke.renyuan + '化' + rlMa.join('/') + '为驿马，主动、出行、有消息', '✓人元化支', ['人元']);
      if (rlz.some(function (z) { return z === '戌' || z === '亥'; })) push('人元化天罗', '凶', '人元' + ke.renyuan + '化支为戌亥（天罗），主困阻、牢狱之象', '✓人元化支', ['人元']);
      if (rlz.some(function (z) { return z === '辰' || z === '巳'; })) push('人元化地网', '凶', '人元' + ke.renyuan + '化支为辰巳（地网），主受困、牵连', '✓人元化支', ['人元']);
      // 课内他支入人元化支之墓
      var MU_WX2 = { 木: '未', 火: '戌', 土: '戌', 金: '丑', 水: '辰' };
      var ruMu = [];
      [[ke.gui.zhi, ke.gui.shen, '贵神'], [ke.jiang.zhi, ke.jiang.name, '将神'], [ke.difen, ke.difenDir, '地分']].forEach(function (t) {
        var m = MU_WX2[U.wuXingMap(t[0])];
        if (m && rlz.indexOf(m) >= 0) ruMu.push(t[2] + t[0] + '入墓');
      });
      if (ruMu.length) push('人元化墓', '凶', '课内' + ruMu.join('、') + '入人元' + ke.renyuan + '化支之墓，主困滞、晦暗', '✓人元化支', ['人元']);
    }
    // 课内三奇（奇全课）：人元+神干+将干
    var g3str = ke.renyuan + ke.gui.gan + ke.jiang.gan;
    var t3 = g3str.split('').sort().join('');
    var sanQiN = t3 === '乙丙丁' ? '地下三奇' : (t3 === '甲戊庚' ? '天上三奇' : (t3 === '壬癸辛' ? '人中三奇' : ''));
    if (sanQiN) push('课内三奇', '吉', '人元+神干+将干（' + g3str + '）构成' + sanQiN + '，利求官得禄、常人得财，可解空亡', '✓课内三奇', ['人元', '贵神', '将神']);
  }

  // ============ 三动五动（课内四位生克，非日干） ============
  // 五行：干=人元天干、神=贵神地支、将=将神地支、方=地分支
  // 五动（克）：妻动=干克方、官动=神克干、贼动=神克将、财动=将克神、鬼动=方克干
  // 三动（生/比）：父母动=方生干、子孙动=干生方、兄弟动=干方比
  var WUDONG_GJ = {
    妻动: '妻动于妻妾，官财防损折',
    官动: '官动利求官，相逢禄位迁',
    贼动: '贼动内贼生，勾连诈不明',
    财动: '财动利求财，占官定不谐',
    鬼动: '鬼动忧灾祸，官事并疾病'
  };
  var SANDONG_GJ = {
    父母动: '方生干，主印绶文书职称，求有得',
    子孙动: '干生方，主添人进口、外来财物',
    兄弟动: '干方比和，主朋友兄弟间争执不和'
  };
  function calcSanDong() {
    var gWX = ke.renyuanWX;   // 干：人元天干五行
    var sWX = ke.gui.wx;      // 神：贵神地支五行
    var jWX = ke.jiang.wx;    // 将：将神地支五行
    var fWX = ke.difenWX;     // 方：地分支五行

    // 五动（课内相克）
    var wuDong = [];
    if (KE[gWX] === fWX) wuDong.push({ name: '妻动', cond: '干克方', left: '人元', leftGZ: ke.renyuan, leftWX: gWX, right: '地分', rightGZ: ke.difen, rightWX: fWX });
    if (KE[sWX] === gWX) wuDong.push({ name: '官动', cond: '神克干', left: '贵神', leftGZ: ke.gui.ganzhi, leftWX: sWX, right: '人元', rightGZ: ke.renyuan, rightWX: gWX });
    if (KE[sWX] === jWX) wuDong.push({ name: '贼动', cond: '神克将', left: '贵神', leftGZ: ke.gui.ganzhi, leftWX: sWX, right: '将神', rightGZ: ke.jiang.ganzhi, rightWX: jWX });
    if (KE[jWX] === sWX) wuDong.push({ name: '财动', cond: '将克神', left: '将神', leftGZ: ke.jiang.ganzhi, leftWX: jWX, right: '贵神', rightGZ: ke.gui.ganzhi, rightWX: sWX });
    if (KE[fWX] === gWX) wuDong.push({ name: '鬼动', cond: '方克干', left: '地分', leftGZ: ke.difen, leftWX: fWX, right: '人元', rightGZ: ke.renyuan, rightWX: gWX });

    // 三动（课内相生/比和）
    var sanDong = [];
    if (SHENG[fWX] === gWX) sanDong.push({ name: '父母动', cond: '方生干', left: '地分', leftGZ: ke.difen, leftWX: fWX, right: '人元', rightGZ: ke.renyuan, rightWX: gWX });
    if (SHENG[gWX] === fWX) sanDong.push({ name: '子孙动', cond: '干生方', left: '人元', leftGZ: ke.renyuan, leftWX: gWX, right: '地分', rightGZ: ke.difen, rightWX: fWX });
    if (gWX === fWX) sanDong.push({ name: '兄弟动', cond: '干方比', left: '人元', leftGZ: ke.renyuan, leftWX: gWX, right: '地分', rightGZ: ke.difen, rightWX: fWX });

    return { wuDong: wuDong, sanDong: sanDong };
  }

  // ============ 格局检测 + 入式歌速断（《金口诀入门与进阶》第十二、十三章） ============
  var GAN_LU2 = { 甲: '寅', 乙: '卯', 丙: '巳', 戊: '巳', 丁: '午', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子' };
  var ZHI_CHONG2 = { 子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅', 卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳' };
  var SANHE_SET = ['寅午戌', '申子辰', '巳酉丑', '亥卯未'];
  function sanHeWX2(z1, z2, z3) {
    if (z1 === z2 || z1 === z3 || z2 === z3) return ''; // 三合需三支互不相同
    for (var i = 0; i < SANHE_SET.length; i++) { if (SANHE_SET[i].indexOf(z1) >= 0 && SANHE_SET[i].indexOf(z2) >= 0 && SANHE_SET[i].indexOf(z3) >= 0) return { '寅午戌': '火', '申子辰': '水', '巳酉丑': '金', '亥卯未': '木' }[SANHE_SET[i]]; }
    return '';
  }
  function isThreeConsecutive(arr) {
    var a = arr.slice().sort(function (x, y) { return x - y; });
    if (a[1] === a[0] + 1 && a[2] === a[0] + 2) return true;
    if (a[0] === 0 && a[1] === 1 && a[2] === 11) return true;
    if (a[0] === 0 && a[1] === 10 && a[2] === 11) return true;
    if (a[0] === 10 && a[1] === 11 && a[2] === 0) return false;
    return false;
  }
  function calcGeJu() {
    var g = ke.renyuanWX, s = ke.gui.wx, j = ke.jiang.wx, f = ke.difenWX;
    var gz = ke.renyuan, sz = ke.gui.zhi, jz = ke.jiang.zhi, fz = ke.difen;
    var b = ke.bazi;
    var kongWang = U.xunKong(b.dayGan + b.dayZhi);
    var kw = [kongWang.substr(0, 1), kongWang.substr(1, 1)];
    var out = [];
    var p = function (name, tag, desc) { out.push({ name: name, tag: tag, desc: desc }); };
    // 1. 一类朝元课（人元干禄三支同）
    var luZ = GAN_LU2[gz];
    if (luZ && sz === luZ && jz === luZ && fz === luZ) p('一类朝元课', '吉', '人元' + gz + '见本属三支' + sz + sz + sz + '，朝元见贵，论考试比赛上下一气得胜，论他事多维持原状；忌见克刑冲。');
    // 2. 四位俱比课
    if (g === s && s === j && j === f) p('四位俱比课', '凶', '四位五行皆' + g + '（' + gz + sz + jz + fz + '），事体重叠、牵连干扰多；遇此年反凶、遇合反吉。');
    // 3. 空亡卦
    var sKong = kw.indexOf(sz) >= 0, jKong = kw.indexOf(jz) >= 0;
    if (sKong && jKong) p('空亡卦（神将皆空）', '凶', '贵神将神皆空，求事稀松，事成亦失；婚姻多有名无实。');
    else if (sKong) p('空亡卦（贵神空）', '凶', '贵神空亡，主事有名无实、贵人无力；旺空尚可，死空则无望。');
    else if (jKong) p('空亡卦（将神空）', '凶', '将神空亡，事成而有缺陷、得而复失；为事之主体虚空。');
    // 4. 新创卦（方克将）
    if (KE[f] === j) p('新创卦', '杂', '地分克将神（' + fz + '克' + jz + '），主准备重新开始、或有新目标新追求。');
    // 5. 云腾卦
    if (SHENG[f] === j && SHENG[j] === s && SHENG[s] === g) p('云腾卦', '吉', '从地分依次上升（' + fz + '生' + jz + '生' + sz + '生' + gz + '），主外出喜事顺利；出外求财利而不一定得财。');
    // 6. 两降卦
    if (SHENG[g] === s && SHENG[s] === j && SHENG[j] === f) p('两降卦', '吉', '从上依次下降（' + gz + '生' + sz + '生' + jz + '生' + fz + '），最利求财，主喜从外来、一喜百喜。');
    // 7. 促装卦
    if (KE[f] === j && KE[j] === s && KE[s] === g) p('促装卦', '凶', '层层上克（' + fz + '克' + jz + '克' + sz + '克' + gz + '），主被迫外出、突破重重阻力或恶性连锁之灾；最终事在高处有结果。');
    // 8. 寇攘卦
    if (KE[g] === s && KE[s] === j && KE[j] === f) p('寇攘卦', '凶', '层层下克（' + gz + '克' + sz + '克' + jz + '克' + fz + '），主被迫返回、外人索取、连锁之灾；克到家底，婚姻财散人离。');
    // 9. 回头生卦
    if (KE[j] === f && SHENG[g] === f) p('回头生卦', '吉', '末位回头生（人元' + gz + '生地分' + fz + '，解将' + jz + '克地分），最后关头有救，终得外援；找物多在归途或家中发现。');
    // 10. 连菇卦
    if (isThreeConsecutive([ZHI.indexOf(sz), ZHI.indexOf(jz), ZHI.indexOf(fz)])) p('连菇卦', '杂', '贵神将神地分连续（' + sz + jz + fz + '），主持续状态或牵连多人；婚姻防第三者，须以桃花等信息佐证。');
    // 11. 引火烧身卦
    var hWX = sanHeWX2(sz, jz, fz);
    if (hWX && KE[hWX] === g) p('引火烧身卦', '凶', '课内' + sz + jz + fz + '合' + hWX + '局克人元' + gz + '，事由己起、困苦自致；合局为快，亦主快速了结。');
    // 12. 日时比合卦
    if (b.dayZhi === b.timeZhi || ZHI_HE[b.dayZhi] === b.timeZhi || ZHI_HE[b.timeZhi] === b.dayZhi) p('日时比合卦', '吉', '日支' + b.dayZhi + '与' + b.timeZhi + '比合，主和合、事易成。');
    // 13. 神将冲合
    if (ZHI_CHONG2[sz] === jz) p('神将相冲', '凶', '贵神将神相冲（' + sz + '冲' + jz + '），先合后破、事多反复，合局遇冲易离异散失。');
    if (ZHI_HE[sz] === jz || ZHI_HE[jz] === sz) p('神将六合', '吉', '贵神将神六合（' + sz + '合' + jz + '），主和合、喜庆、交易有成。');
    // 14. 分局卦（上下两组：上面人元贵神、下面将神地分；分局相克或分局相生）
    if (KE[s] === g && KE[j] === f) p('分局相克', '凶', '分局卦：贵神' + sz + '克人元' + gz + '、将神' + jz + '克地分' + fz + '（上下两组各克），主上下分离、事破两端，占婚多离、占讼多争。');
    if (SHENG[s] === g && SHENG[j] === f) p('分局相生', '吉', '分局卦：贵神' + sz + '生人元' + gz + '、将神' + jz + '生地分' + fz + '（上下两组各生），主一事分二、所趋各异而皆吉。');
    // 15. 内外交战卦（人元地分相克）
    if (KE[g] === f || KE[f] === g) p('内外交战卦', '凶', '人元地分相克（' + gz + '与' + fz + '），内外不合、上下交战，多生口舌争端。');
    return out;
  }

  // ============ 六十四课铃（刘柏林《金口诀深造导读·中级本》第二章，全部 64 课） ============
  // 三合局：人元化支亦参与成局（用户指定）。出处统一标注"六十四课铃第N课·卦名"
  function calcKeLing() {
    var g = ke.renyuanWX, s = ke.gui.wx, j = ke.jiang.wx, f = ke.difenWX;
    var gz = ke.renyuan, sz = ke.gui.zhi, jz = ke.jiang.zhi, fz = ke.difen;
    var b = ke.bazi;
    var isDay = ke.isDay;
    var kongWang = U.xunKong(b.dayGan + b.dayZhi);
    var kw = [kongWang.substr(0, 1), kongWang.substr(1, 1)];
    var z4 = [sz, jz, fz];
    var sdks = ke.sidakongwang;
    function sdkw(z) { return (sdks === '水' && (z === '亥' || z === '子')) || (sdks === '金' && (z === '申' || z === '酉')); }
    function isKong(z) { return kw.indexOf(z) >= 0 || sdkw(z); }
    function isKongAny(za) { for (var i = 0; i < za.length; i++) if (isKong(za[i])) return true; return false; }
    // 人元化支集合
    var rl = ganToZhiList(gz);
    // 三奇：人元+神干+将干（顺序不论）
    var g3 = gz + ke.gui.gan + ke.jiang.gan;
    function sanQi(s3) { var t = s3.split('').sort().join(''); return t === '乙丙丁' || t === '甲戊庚' || t === '壬癸辛'; }
    var out = [];
    function pk(name, tag, desc, src) { out.push({ name: name, tag: tag, desc: desc + '（出处：六十四课铃' + src + '）' }); }
    var sanhe = sanHeAny();
    var sh = sanhe ? sanhe.wx : '';

    // 甲·比和/伏反吟类
    if (sanhe && KE[f] === g) pk('鬼动全身课', '凶', '阴害卦：课内' + sanhe.zs.join('') + '合' + sh + '局，地分' + fz + '克人元' + gz + '（鬼动），主灾病忧疑、伤身破财、暗中受害。', '第1课');
    if (sanhe && KE[s] === g) pk('官禄全身课', '吉', '进达卦：课内' + sanhe.zs.join('') + '合' + sh + '局，贵神' + sz + '克人元' + gz + '（官动），主求官得禄、常人进财，亦有官事。', '第2课');
    if (sanhe && KE[s] !== g && KE[j] === s) pk('全身课', '吉', '从顺卦：课内合' + sh + '局，无官动、将' + jz + '克神' + sz + '为财动，主财，其为事吉。', '第3课');
    if (sanQi(g3)) pk('奇全课', '吉', '利进卦：人元' + gz + '+神干' + ke.gui.gan + '+将干' + ke.jiang.gan + '构成三奇（' + (g3 === '乙丙丁' || g3 === '丙乙丁' ? '乙丙丁' : (g3 === '甲戊庚' || g3 === '戊甲庚' ? '甲戊庚' : '壬癸辛')) + '），利求官禄，常人得财，大吉。', '第4课');
    var siWeiTong = g === s && s === j && j === f;
    if (siWeiTong) {
      var hasChong = ZHI_CHONG[sz] === jz || ZHI_CHONG[jz] === fz || ZHI_CHONG[sz] === fz;
      var hasHe = ZHI_HE[sz] === jz || ZHI_HE[jz] === fz || ZHI_HE[sz] === fz || HE_GAN[gz] === ke.gui.gan;
      var hasKe = KE[g] !== s; // 四位同五行则无生克；此处恒 false，保留占位
      if (!hasChong && !hasHe) pk('朝元课', '杂', '德载卦：四位' + gz + sz + jz + fz + '同类相比、无生克无冲合害破，问家事朝见诏对则吉，常人非吉。', '第5课');
      else pk('俱比课', '凶', '合之卦：四位' + gz + sz + jz + fz + '同类相比（带冲合），主同类相争、党比，事体重叠，占病大凶。', '第6课');
    }
    if (g === f) pk('正比课', '杂', '首正卦：人元' + gz + '与地分' + fz + '同类（' + g + '），主共为自己事，求知结好多吉。', '第7课');
    if (g === s) pk('远比课', '杂', '为己卦：人元' + gz + '与贵神' + sz + '同类，主自己事及亲戚事。', '第8课');
    if (s === j) pk('次比课', '杂', '审认卦：贵神' + sz + '与月将' + jz + '比和，主亲戚之事，随五动论事。', '第9课');
    if (j === f) pk('远比课', '杂', '寄托卦：月将' + jz + '与地分' + fz + '比和，主他人之事，六合主和合。', '第10课');
    if (jz === fz) pk('伏吟课', '杂', '窜伏卦：月将' + jz + '与地分' + fz + '相同，主百事不动、逃亡隐伏未至。', '第11课');
    if (sz === jz && KE[g] === s && KE[s] === f) pk('神将伏吟课', '凶', '犹豫卦：贵神将神同' + sz + '，人元' + gz + '克之、神将克地分' + fz + '，主心欲动而身不动，疑惑不决。', '第12课');
    if (ZHI_CHONG[jz] === fz) pk('反吟课', '凶', '动摇卦：月将' + jz + '与地分' + fz + '对冲，主事情反复、吉凶多不成，来去动摇。', '第13课');
    if (ZHI_CHONG[sz] === jz) pk('神将反吟课', '凶', '乖运卦：贵神' + sz + '与月将' + jz + '对冲，主外事多不利、事多迅速。', '第14课');
    if (ZHI_CHONG[sz] === jz && '卯酉'.indexOf(sz) >= 0 && '卯酉'.indexOf(jz) >= 0) pk('反鬼入门课', '凶', '飞祸卦：贵神' + sz + '与月将' + jz + '相冲且互为卯酉门户，主占事不成、改门移宅凶。', '第15课');

    // 乙·门户关锁类（四位相邻定向：a上见b=相邻、a在下、b在上）
    var gjs2 = guanGeSuo();
    if (gjs2.indexOf('关') >= 0) pk('关课', '凶', '杜基卦：酉上见寅木（' + gjs2.join('、') + '）为关，主出行不通、行人不至、囚禁难出、病孕有隔。', '第16课');
    if (gjs2.indexOf('隔') >= 0) pk('隔课', '凶', '乖越卦：卯上见辰/戌土（' + gjs2.join('、') + '）为隔，主参投谒人不见、出行囚禁孕病皆不利。', '第17课');
    if (gjs2.indexOf('锁') >= 0) pk('锁课', '凶', '构囚卦：卯上见申金（' + gjs2.join('、') + '）为锁，占囚禁行人病孕皆不利、内外上下不通。', '第18课');
    if (gjs2.indexOf('斩关') >= 0) pk('斩关课', '吉', '避罪卦：酉→寅→申三连（关上见金）为斩关，打通关卡，凶中得吉，避罪逃亡、孕病出行皆利。', '第19课');
    if (gjs2.indexOf('毁隔') >= 0) pk('毁隔课', '吉', '脱石卦：卯→辰/戌→寅三连（隔上见木）为毁隔，破开堵塞，望人立至、囚禁孕病求事皆无阻。', '第20课');
    if (gjs2.indexOf('破锁') >= 0) pk('叩键课', '吉', '天解卦：卯→申→午三连（锁上见火）为破锁，囚禁遇赦宥、凶中得吉兆。', '第21课');

    // 丙·合/刑/比和类
    if (HE_GAN[gz] === ke.gui.gan) pk('官合课', '吉', '得禄卦：神干' + ke.gui.gan + '与人元' + gz + '天干五合，官仕得禄、常人进产，亦主官事动。', '第22课');
    if (ZHI_HE[sz] === jz && KE[g] !== s && KE[s] !== g) pk('正合课', '吉', '如兰卦：贵神' + sz + '与月将' + jz + '六合、主客无克，主亲戚和会、人财相庆之喜。', '第23课');
    if (ZHI_HE[sz] === jz) {
      var gzXing = false;
      for (var xi = 0; xi < rl.length; xi++) if (zhiXing(rl[xi], fz)) gzXing = true;
      if (gzXing) pk('鬼合课', '凶', '鬼同卦：神将' + sz + jz + '六合、主客（人元' + gz + '化' + rl.join('/') + '与地分' + fz + '）相刑，主人出外、占病即凶、占宅有怪祟。', '第24课');
    }
    if (j === g) pk('干将比和课', '杂', '结绶卦：月将' + jz + '（' + j + '）与人元' + gz + '同类，有非常推擢之兆，然先背而后向。', '第25课');
    if (isKongAny(rl) && isKong(sz) && isKong(jz) && isKong(fz)) pk('空亡课', '凶', '蒿目卦：人元化支' + rl.join('/') + '与贵神' + sz + '月将' + jz + '地分' + fz + '四位全空，主身心疑惑、求事皆不成。', '第26课');
    if (ZHI_HE[sz] === jz && isKong(fz) && KE[f] === g) pk('鬼空课', '凶', '粮莠卦：神将' + sz + jz + '六合、地分' + fz + '空亡、方克干（鬼动），主求事有名无实，先忧危终得吉。', '第27课');
    if (isKongAny(rl) && sdkw(sz) && sdkw(jz)) pk('四大空课', '凶', '病败卦：人元' + gz + '（化' + rl.join('/') + '）、贵神' + sz + '、月将' + jz + '均四大空亡（' + sdks + '），主其事吉凶皆不成。', '第28课');

    // 丁·分局/合局/次第生克
    if (SHENG[s] === g && SHENG[j] === f) pk('分局相生课', '吉', '双宜卦：贵神' + sz + '生人元' + gz + '、月将' + jz + '生地分' + fz + '，一事分为二事、所趋各异而皆吉。', '第29课');
    if (KE[s] === g && KE[j] === f) pk('分居相克课', '凶', '孤别卦：贵神' + sz + '克人元' + gz + '、月将' + jz + '克地分' + fz + '，主事为君子吉小人凶。', '第30课');
    if (SHENG[g] === s && SHENG[f] === j) pk('合局相生课', '吉', '同德卦：人元' + gz + '生贵神' + sz + '、地分' + fz + '生月将' + jz + '（外生内），二事合为一事、内外并力合谋。', '第31课');
    if (KE[g] === s && KE[f] === j) pk('合局相克课', '凶', '因溃卦：人元' + gz + '克贵神' + sz + '、地分' + fz + '克月将' + jz + '（外克内），和中不和，共为事先喜而后不和。', '第32课');
    if (isThreeConsecutive([ZHI.indexOf(sz), ZHI.indexOf(jz), ZHI.indexOf(fz)])) pk('连茹课', '杂', '汇升卦：方将神' + fz + jz + sz + '紧贴顺序排列，主事体重叠不一，顺连茹事体多顺。', '第33课');
    if (SHENG[f] === j && SHENG[j] === s && SHENG[s] === g) pk('阶生相生课', '吉', '云腾卦：' + fz + '生' + jz + '生' + sz + '生' + gz + '（自下次第生上），主有人出外远去，求事得喜庆。', '第34课');
    if (KE[f] === j && KE[j] === s && KE[s] === g) pk('阶生相克课', '凶', '促装卦：' + fz + '克' + jz + '克' + sz + '克' + gz + '（自下次第克上），主逼迫出外之事，身有口舌官鬼之灾。', '第35课');
    if (SHENG[g] === s && SHENG[s] === j && SHENG[j] === f) pk('覆孟相生课', '吉', '两降卦：' + gz + '生' + sz + '生' + jz + '生' + fz + '（自上次第生内），主自外添进人口财帛、又主行人归。', '第36课');
    if (KE[g] === s && KE[s] === j && KE[j] === f) pk('覆孟相克课', '凶', '寇攘卦：' + gz + '克' + sz + '克' + jz + '克' + fz + '（自上次第克内），主迫而还乡、及求索以致口舌。', '第37课');

    // 戊·比局（上下分组比和互克）
    if (g === s && j === f) {
      if (KE[g] === j) pk('阴阳非课', '凶', '兼弱卦：上二位（人元' + gz + '贵神' + sz + '）比、下二位（将' + jz + '方' + fz + '）比，上克下，主小人斗讼、君子竞斗扰攘之事。', '第38课');
      if (KE[j] === g) pk('阴阳并克课', '凶', '犯上卦：上二位比、下二位比，下克上，主尊长怒、内外不合，亦讼之兆。', '第39课');
    }
    // 己·众克/众生/归进
    if (s === j && j === f && KE[s] === g) pk('并来克身课', '凶', '深沉卦：神将方三位' + sz + jz + fz + '比和同克人元' + gz + '，主身灾祸、人离散之事。', '第40课');
    if (g === j && j === f && SHENG[g] === s) pk('并来生身课', '凶', '众附卦：人元' + gz + '月将' + jz + '地分' + fz + '同生贵神' + sz + '，主内外顺从、迁官进财，随神断之。', '第41课');
    if (g === s && s === j && KE[g] === f) pk('并来克位课', '凶', '泉涸卦：干神将三位' + gz + sz + jz + '比和同克地分' + fz + '，主迅速争斗之事、及来人取索。', '第42课');
    if (g === s && s === j && SHENG[g] === f) pk('并来生位课', '吉', '慈幼卦：干神将三位' + gz + sz + jz + '比和同生地分' + fz + '，主外来生内、卑幼尤喜。', '第43课');
    if (KE[g] === s && KE[g] === j && KE[g] === f) pk('归来相克课', '凶', '被劾卦：人元' + gz + '克贵神将神地分下三位，主取索、迫剥官职事、外来克内。', '第44课');
    if (SHENG[g] === s && SHENG[g] === j && SHENG[g] === f) pk('归来相生课', '吉', '家肥卦：人元' + gz + '生贵神将神地分下三位，主外人添进入财、官讼得理。', '第45课');
    if (KE[f] === s && KE[f] === j && KE[f] === g) pk('进体相克课', '凶', '肇共卦：地分' + fz + '克贵神将神人元上三位，主并方之事、将谋财禄。', '第46课');
    if (SHENG[f] === s && SHENG[f] === j && SHENG[f] === g) pk('进体相生课', '吉', '培根卦：地分' + fz + '生贵神将神人元上三位，主谒贵人求财吉。', '第47课');

    // 庚·同源类（中二爻对上下二爻）
    if (s === j && KE[s] === g && KE[s] === f) pk('神将同源克主客课', '凶', '内间卦：贵神月将' + sz + jz + '同克人元地分，主兄弟不和、人离财散、间谍之言。', '第48课');
    if (s === j && SHENG[s] === g && SHENG[s] === f) pk('神将同源生主客课', '吉', '内和卦：贵神月将' + sz + jz + '同生人元地分，主向外而内、志气不同皆成遂。', '第49课');
    if (g === f && KE[g] === s && KE[g] === j) pk('主客同源克神将课', '凶', '凌迫卦：人元地分同克贵神月将，主上下凌迫、无所诉词、囚系难脱。', '第50课');
    if (g === f && SHENG[g] === s && SHENG[g] === j) pk('主客同源生神将课', '吉', '会神卦：人元地分同生贵神月将，主臣子同心同德。', '第51课');
    if (SHENG[f] === j && SHENG[s] === g && f === s && j === g) pk('自内隔生课', '吉', '匪棘卦：方' + fz + '生将' + jz + '、神' + sz + '生干' + gz + '且方神同、将干同，主子孙外出、交易求禄和合之喜。', '第52课');
    if (SHENG[g] === s && SHENG[j] === f && g === j && s === f) pk('自外隔生课', '吉', '利用卦：干' + gz + '生神' + sz + '、将' + jz + '生方' + fz + '且干将同、神方同，主外迁进之喜。', '第53课');
    if (KE[s] === f && KE[j] === g && KE[g] === s) pk('隔克课', '凶', '点构卦：神克方、将克干、干克神（' + sz + '克' + fz + '、' + jz + '克' + gz + '、' + gz + '克' + sz + '），主第互相加、乖违不明事。', '第54课');
    if (KE[s] === g && KE[f] === g) pk('天地并来克身课', '凶', '死刑卦：贵神' + sz + '与地分' + fz + '同克人元' + gz + '，主争官讼、占病死亡。', '第55课');

    // 辛·特殊
    if (b.timeZhi === '卯' || b.timeZhi === '酉') pk('换神课', '杂', '玄机卦：占时' + b.timeZhi + '在阴阳交替之时（卯/酉），贵神按阳占阴占分属两神而交换，主占凶得吉、占吉得凶（推测）。', '第56课');
    // 57 向空课：先按日干定昼夜贵人，昼时应取昼贵、夜时应取夜贵；
    // 贵神支落到相反的贵人支则向空（昼占夜贵/夜占昼贵）
    var dayG = b.dayGan;
    var zhouGui, yeGui;
    if ('甲戊庚'.indexOf(dayG) >= 0) { zhouGui = '丑'; yeGui = '未'; }
    else if ('乙己'.indexOf(dayG) >= 0) { zhouGui = '子'; yeGui = '申'; }
    else if ('丙丁'.indexOf(dayG) >= 0) { zhouGui = '亥'; yeGui = '酉'; }
    else if ('壬癸'.indexOf(dayG) >= 0) { zhouGui = '巳'; yeGui = '卯'; }
    else { zhouGui = '午'; yeGui = '寅'; } // 辛：昼午夜寅
    var guiShenZ = ke.gui.zhi;
    if ((isDay && guiShenZ === yeGui) || (!isDay && guiShenZ === zhouGui)) pk('向空课', '凶', '谷响卦：' + (isDay ? '昼' : '夜') + '占（应取' + (isDay ? '昼' : '夜') + '贵' + (isDay ? zhouGui : yeGui) + '），而贵神' + guiShenZ + '落' + (isDay ? '夜' : '昼') + '贵' + (isDay ? yeGui : zhouGui) + '之位（昼占夜贵/夜占昼贵），主求事不成、吉而反凶、反复不定。', '第57课');
    // 58 背神课：结合天乙贵人诀（默认昼夜顺逆 / 果老落宫），看当天贵人所落盘位，地分在其前后一位（推测）
    var guiPanIdx = ke.tianPan.indexOf(ke.guiRen);
    var dfp = ZHI.indexOf(fz);
    if (guiPanIdx >= 0 && (Math.abs(dfp - guiPanIdx) === 1 || Math.abs(dfp - guiPanIdx) === 11)) pk('背神课', '凶', '违戾卦：地分' + fz + '在当天贵人' + ke.guiRen + '（' + ke.guiRenMethod + '）落位前后一位（相背），主昔亲今疏、尊卑不顺之情（推测）。', '第58课');
    if (gz === '丁' && fz === '酉') pk('丁鬼入门课', '凶', '传尸卦：人元丁火克地分酉金（丁入酉做鬼），主鬼怪官灾病人及六畜财散。', '第59课');
    if (s === j && KE[f] === g) pk('主来刑客课', '凶', '枭鸣卦：神将' + sz + jz + '比和、地分' + fz + '克人元' + gz + '（鬼动），主鬼怪官灾病人及六畜财散之事。', '第60课');
    if (KE[s] === j) pk('神来克将课', '凶', '内贼卦：贵神' + sz + '克月将' + jz + '（贼动），主亲戚盗窃自己财物、勾连虚诈不明事。', '第61课');
    if (KE[g] === f) pk('客来克主课', '凶', '问招卦：人元' + gz + '克地分' + fz + '，主妻妾之忧及财帛不明之事。', '第62课');
    if (sz === '辰' && jz === '戌') pk('地户入天门课', '凶', '天冲卦：贵神辰土（勾陈）临月将戌土（天魁），辰冲戌，主官事重重、占病大凶、是天罗。', '第63课');
    if (sz === '戌' && jz === '辰') pk('天门入地户课', '凶', '地系卦：贵神戌土（天魁）临月将辰土（天罡），主讼重、占病凶、家不和，天罗地网。', '第64课');

    return out;
  }

  // ============ 分类断（问事速断，依据中级本第一编分类预测） ============
  function calcFenlei() {
    var b = ke.bazi;
    var dayGZ = b.dayGan + b.dayZhi;
    var kwArr = [U.xunKong(dayGZ).substr(0, 1), U.xunKong(dayGZ).substr(1, 1)];
    var sd = calcSanDong();
    var wdNames = sd.wuDong.map(function (d) { return d.name; });
    var sdNames = sd.sanDong.map(function (d) { return d.name; });
    function hasW(n) { return wdNames.indexOf(n) >= 0; }
    function hasS(n) { return sdNames.indexOf(n) >= 0; }
    function hasShen4(n) {
      var W4 = ['人元', '贵神', '将神', '地分'];
      for (var i = 0; i < P.length; i++) {
        if (P[i].name === n && P[i].hit) {
          for (var j = 0; j < P[i].hitArr.length; j++) if (W4.indexOf(P[i].hitArr[j]) >= 0) return true;
        }
      }
      return false;
    }
    function isK(z) { return kwArr.indexOf(z) >= 0; }
    function isSDK(z) { return (ke.sidakongwang === '水' && (z === '亥' || z === '子')) || (ke.sidakongwang === '金' && (z === '申' || z === '酉')); }
    var wsMap = { 人元: ke.renyuan, 贵神: ke.gui.zhi, 将神: ke.jiang.zhi, 地分: ke.difen };
    function wsOf(pos) { return ke.wangShuai[wsMap[pos]] || ''; }
    function wang(pos) { var w = wsOf(pos); return w === '旺' || w === '相'; }
    var g = ke.renyuanWX, s = ke.gui.wx, j = ke.jiang.wx, f = ke.difenWX;
    var gz = ke.renyuan, sz = ke.gui.zhi, jz = ke.jiang.zhi, fz = ke.difen;
    var guiShen = ke.gui.shen;
    var out = [];
    function add(key, title, points, jx) { out.push({ key: key, title: title, points: points, jixiong: jx }); }

    // 1. 求财：将=财爻、方=副财爻、干=求财人、神=合作方
    (function () {
      var points = [], jx = '杂';
      var caiWang = wang('将神'), caiKong = isK(jz) || isSDK(jz);
      if (caiWang && !caiKong) { points.push('财爻' + jz + '旺相不空：可求财'); jx = '吉'; }
      else if (caiKong && !caiWang) { points.push('财爻' + jz + '休囚又空：不可求财'); jx = '凶'; }
      else if (!caiWang) { points.push('财爻' + jz + '休囚：求财艰难'); jx = '凶'; }
      else { points.push('财爻' + jz + '旺相但旬空：旬内难求、出旬可求'); jx = '杂'; }
      if (hasW('财动')) { points.push('财动（将克神）：求财必得、营求喜自来'); if (jx !== '凶') jx = '吉'; }
      if (hasW('贼动')) { points.push('贼动（神克将）：防暗失、破财受劫'); jx = '凶'; }
      if (hasW('鬼动')) { points.push('鬼动（方克干）：有突发/外地财，事牵连多人'); if (jx === '吉') jx = '杂'; }
      if (hasW('妻动')) points.push('妻动（干克方）：靠妻家力量求财');
      if (hasW('官动')) points.push('官动（神克干）：求财涉官方、防争讼');
      if (hasShen4('天罗') || hasShen4('地网')) { points.push('课见天罗地网：主争讼，求财忌'); jx = '凶'; }
      if (hasShen4('劫煞')) points.push('课见劫煞：求财受劫');
      if (!points.length) points.push('课中财爻无大生克，宜观旺衰再断');
      add('求财', '求财速断', points, jx);
    })();
    // 2. 求官：神=官爻；朱雀=官禄、父母动=印绶
    (function () {
      var points = [], jx = '杂';
      if (hasW('官动')) { points.push('官动（神克干）：主有官职、利求官'); if (jx !== '凶') jx = '吉'; }
      else points.push('无官动：官看贵神旺相，临天乙/青龙/朱雀/白虎/太常/月建/太岁为有官');
      var gWang = wang('贵神'), gKong = isK(sz) || isSDK(sz);
      if (gWang && !gKong) { points.push('官爻（贵神' + sz + '）旺相不空：可求官'); if (jx !== '凶') jx = '吉'; }
      else if (gKong) { points.push('官爻' + sz + '空亡：求官难成、失职'); jx = '凶'; }
      else points.push('官爻' + sz + '休囚：眼下难任实职');
      if (SHENG[s] === g) points.push('神生干：带物求官');
      else if (SHENG[g] === s) points.push('干生神：受上司赏识');
      else if (KE[g] === s) { points.push('干克神：受领导压制'); if (jx !== '凶') jx = '杂'; }
      if (hasS('父母动')) points.push('父母动（方生干）：印绶动，利求官升迁');
      if (hasShen4('驿马')) points.push('课见驿马：官动带马，主新得官/转官');
      if (hasShen4('天罗') || hasShen4('地网')) { points.push('课见天罗地网：主牢狱，求官大忌'); jx = '凶'; }
      if (!points.length) points.push('课中官爻平平，宜观旺衰再断');
      add('求官', '求官速断', points, jx);
    })();
    // 3. 婚姻：未婚男将=男方=女；已婚用爻=问事人、神将=配偶
    (function () {
      var points = [], jx = '杂';
      var shengHe = ZHI_HE[sz] === jz;
      var chongKe = ZHI_CHONG[sz] === jz || KE[s] === j || KE[j] === s;
      if (shengHe) { points.push('神将' + sz + jz + '六合：已婚主恩爱白头、未婚主恋爱顺'); if (jx !== '凶') jx = '吉'; }
      else if (chongKe) { points.push('神将' + sz + jz + '刑冲克害：主夫妻不和、婚难成'); jx = '凶'; }
      else points.push('神将' + sz + jz + '平平，宜观用爻旺衰再断');
      if (hasW('妻动')) { points.push('妻动（干克方）：主妻先亡、婚姻破财'); jx = '凶'; }
      if (hasW('鬼动')) { points.push('鬼动（方克干）：主夫先亡、事牵连'); jx = '凶'; }
      if (isK(sz) || isK(jz)) { points.push('神将见空亡：主婚姻有名无实'); jx = '凶'; }
      if (hasShen4('桃花')) points.push('课见桃花：防第三者/情事');
      var jy = '阳阴'.charAt(ZHI.indexOf(jz) % 2);
      points.push('将神' + jz + '为' + (jy === '阳' ? '阳' : '阴') + '，未婚男问将=男方、方=女');
      add('婚姻', '婚姻速断', points, jx);
    })();
    // 4. 官司：干=对方、神=自己
    (function () {
      var points = [], jx = '杂';
      if (KE[s] === g) { points.push('贵神' + sz + '克人元' + gz + '（官动）：自己有理、可胜'); jx = '吉'; }
      else if (KE[g] === s) { points.push('人元' + gz + '克贵神' + sz + '：对方有理、不利'); jx = '凶'; }
      else points.push('神干' + sz + gz + '不相克：官司胜负看旺衰');
      var sWang = wang('贵神'), gWang = wang('人元');
      if (sWang && !gWang) points.push('贵神旺、人元休：对方败诉、我胜');
      else if (gWang && !sWang) { points.push('人元旺、贵神休：自己败诉'); if (jx !== '吉') jx = '凶'; }
      if (isK(sz) || isK(gz)) { points.push('神/干见空亡：官司打不起来'); jx = '凶'; }
      if (hasW('官动')) points.push('官动：无官司反有官司、有官司则上诉');
      if (['勾陈', '白虎', '腾蛇'].indexOf(guiShen) >= 0 && KE[s] === f) { points.push('贵神' + guiShen + '克地分：主血光杖打'); jx = '凶'; }
      add('官司', '官司速断', points, jx);
    })();
    // 5. 疾病：干=病人、方=医生；干头目、神胸、将腹、方腿脚
    (function () {
      var points = [], jx = '杂';
      if (KE[f] === g) { points.push('方克干（鬼动）：方为医、干为病，病可治'); jx = '吉'; }
      else if (KE[g] === f) { points.push('干克方：病克医，难治'); jx = '凶'; }
      else if (SHENG[f] === g) { points.push('方生干：越治越重，宜换医'); jx = '凶'; }
      else if (SHENG[g] === f) points.push('干生方：可医');
      else points.push('干方比和：医治无效，须转医');
      var wxs4 = [g, s, j, f], keW = null;
      for (var k1 = 0; k1 < wxs4.length; k1++) {
        for (var k2 = 0; k2 < wxs4.length; k2++) {
          if (KE[wxs4[k1]] === wxs4[k2]) { keW = wxs4[k2]; break; }
        }
        if (keW) break;
      }
      var bing = { 金: '肺病咳嗽、伤筋骨', 木: '肝胆风疾、眼患', 火: '心烦热、血疾', 土: '脾胃伤、饮食病', 水: '肾寒、泻痢水蛊' }[keW];
      if (bing) points.push('课内' + keW + '受克：主' + bing);
      var yz = wsMap[ke.yongShen];
      if (yz && '子午卯酉'.indexOf(yz) >= 0) points.push('用爻' + yz + '为四仲：主暴病、饮食病');
      else if (yz && '寅申巳亥'.indexOf(yz) >= 0) points.push('用爻' + yz + '为四孟：主天行疫病');
      else if (yz && '辰戌丑未'.indexOf(yz) >= 0) points.push('用爻' + yz + '为四季：主慢性病');
      if (hasShen4('丧门') || hasShen4('吊客') || guiShen === '白虎') { points.push('课见丧门/吊客/白虎：主凶祸'); jx = '凶'; }
      if (hasShen4('天德') || hasShen4('月德') || hasShen4('天医') || hasShen4('地医') || hasShen4('天赦')) points.push('课见天德/月德/天医/地医/天赦：主吉庆');
      add('疾病', '疾病速断', points, jx);
    })();
    // 6. 出行：上克下则返、下克上则行；忌关隔锁/五鬼/往亡；子午卯酉四游星
    (function () {
      var points = [], jx = '杂';
      if (KE[f] === g) { points.push('下克上（方克干）：被迫出行有阻'); jx = '凶'; }
      else if (SHENG[f] === g) points.push('下生上（方生干）：自愿出行有力');
      else if (KE[g] === f) { points.push('上克下（干克方）：被迫返回，不可行'); jx = '凶'; }
      else if (SHENG[g] === f) points.push('上生下（干生方）：自愿归来');
      if (hasShen4('关隔锁')) { points.push('课见关隔锁：出行受阻不通'); jx = '凶'; }
      if (hasShen4('五鬼') || hasShen4('往亡') || hasShen4('劫煞') || hasShen4('天罗') || hasShen4('地网')) { points.push('课见五鬼/往亡/劫煞/天罗地网：不宜远行'); jx = '凶'; }
      var yx = [sz, jz, fz].filter(function (z) { return '子午卯酉'.indexOf(z) >= 0; });
      if (yx.length) points.push('课见' + yx.join('、') + '（四游星）：主出行、找人不见');
      add('出行', '出行速断', points, jx);
    })();
    // 7. 走失：以走失人属相为地分；六合=方位、三合=归期
    (function () {
      var points = [], jx = '杂';
      if (SHENG[j] === f || SHENG[s] === f) { points.push('外生内（神/将生地分）：走失可回'); jx = '吉'; }
      else if (KE[j] === f || KE[s] === f) points.push('外克内（神/将克地分）：想回但有阻');
      else if (KE[f] === j || KE[f] === s) { points.push('内克外（地分克神/将）：难回'); jx = '凶'; }
      if (KE[s] === j) { points.push('将' + jz + '受神' + sz + '克：失者有凶灾'); jx = '凶'; }
      var lh = ZHI_HE[fz];
      points.push('六合' + lh + '为所失方位（' + (DIRECTION[lh] || '') + '）');
      var sh3 = sanHeWX2(sz, jz, fz);
      if (sh3) points.push('课内' + sz + jz + fz + '合' + sh3 + '局：三合定归期（如申辰缺子待子日）');
      else points.push('未成三合局，归期看六合或旺相之日');
      add('走失', '走失速断', points, jx);
    })();
    // 8. 失盗：将为财帛、贵为贼
    (function () {
      var points = [], jx = '杂';
      if (KE[j] === s) { points.push('将克神（财动）：财大利、不失'); jx = '吉'; }
      else if (KE[s] === j) { points.push('贵克将（贼动）：必破财'); jx = '凶'; }
      if (KE[g] === j) points.push('人元克将：财失');
      else if (KE[j] === g) points.push('将克人元：财不失');
      if (guiShen === '玄武') { points.push('课见玄武' + sz + '（贼星，随天后设置）：主盗贼，看玄武落位断贼去向'); jx = '凶'; }
      if (hasShen4('天罗') || hasShen4('地网')) points.push('课见天罗地网：失物能寻到');
      var yz2 = wsMap[ke.yongShen];
      if (yz2 && isK(yz2)) points.push('用爻' + yz2 + '空亡：财物一般不丢');
      add('失盗', '失盗速断', points, jx);
    })();
    // 9. 生育：将阳=男孩、将阴=女孩
    (function () {
      var points = [], jx = '杂';
      var jy2 = '阳阴'.charAt(ZHI.indexOf(jz) % 2);
      points.push('将神' + jz + '为' + (jy2 === '阳' ? '阳' : '阴') + '：主生' + (jy2 === '阳' ? '男孩' : '女孩'));
      var jws = wsOf('将神');
      if (jws === '旺' || jws === '相') { points.push('用爻旺相：胎儿聪明体健'); jx = '吉'; }
      else if (jws === '死' || jws === '囚') { points.push('用爻死囚：胎儿有危险'); jx = '凶'; }
      else points.push('用爻休：胎儿体弱');
      if (ZHI_CHONG[jz] === sz || ZHI_CHONG[jz] === fz) { points.push('月将' + jz + '受冲：防损胎/宫外孕'); jx = '凶'; }
      if (hasW('官动')) points.push('官动：防计划外怀孕惊动官方');
      add('生育', '生育速断', points, jx);
    })();
    // 10. 升学：将克干上榜、官动/父母动利考、见马立就
    (function () {
      var points = [], jx = '杂';
      if (KE[j] === g) { points.push('将克干：主喜事重重、科举上榜'); jx = '吉'; }
      if (hasW('官动')) { points.push('官动：利求官升学'); if (jx !== '凶') jx = '吉'; }
      if (hasS('父母动')) points.push('父母动（印绶）：利升学晋职称');
      if (hasShen4('驿马') || hasShen4('天马')) { points.push('课见驿马/天马：升学立就'); if (jx !== '凶') jx = '吉'; }
      if (guiShen === '天空') points.push('贵神天空（奏书之神）：录取无疑');
      if (wang(ke.yongShen)) { points.push('用爻旺相：成绩佳'); if (jx !== '凶') jx = '吉'; }
      else { var yws = wsOf(ke.yongShen); if (yws === '死' || isK(wsMap[ke.yongShen])) { points.push('用爻死/空：升学受阻'); if (jx !== '吉') jx = '凶'; } }
      if (!points.length) points.push('课中无大利升学之象，宜观用爻旺衰');
      add('升学', '升学速断', points, jx);
    })();
    // 11. 天气：论人元旺相休囚死，旺为有、死为无
    (function () {
      var points = [];
      var gws = wsOf('人元');
      var tq = { 水: { 旺: '大雨/大雪', 相: '小雨/小雪', 休: '阴雨', 死: '无雨' }, 火: { 旺: '晴天酷热', 相: '晴朗', 休: '云薄', 死: '见日' }, 木: { 旺: '大风', 相: '有风', 休: '微风', 死: '无风' }, 金: { 旺: '冰雹/严寒', 相: '霜雪', 休: '清凉', 死: '无霜' }, 土: { 旺: '阴云密布', 相: '多云', 休: '云淡', 死: '云少' } };
      var t = (tq[g] || {})[gws] || '平晴';
      points.push('人元' + gz + '（' + g + '）' + gws + '：主' + t);
      points.push('论天气以人元旺相休囚死为主，旺为有、死为无');
      points.push('水旺雨雪、火旺晴、木旺风、金旺寒冰雹、土旺云雾多云');
      points.push('注：天气占应另起课（地分取子卯午酉），此处按本课人元近似');
      add('天气', '天气速断', points, '杂');
    })();
    // 12. 牢狱：地分巳亥+将辰戌+神寅卯木+干金；木入土；三刑
    (function () {
      var points = [], jx = '杂';
      if ('巳亥'.indexOf(fz) >= 0 && '辰戌'.indexOf(jz) >= 0 && '寅卯'.indexOf(sz) >= 0 && g === '金') { points.push('地分' + fz + '（气索）+ 将' + jz + '土神 + 神' + sz + '木 + 干金：主牢狱之灾'); jx = '凶'; }
      if (g === '木' && '辰戌丑未'.indexOf(fz) >= 0) { points.push('木在上土在下（人元' + gz + '克地分' + fz + '）：木入土为刑狱'); jx = '凶'; }
      if (('寅巳申'.indexOf(sz) >= 0 && '寅巳申'.indexOf(jz) >= 0) || ('丑戌未'.indexOf(sz) >= 0 && '丑戌未'.indexOf(jz) >= 0)) { points.push('神将' + sz + jz + '成三刑：主斗讼牢狱'); jx = '凶'; }
      if (jx === '凶') { var xf = { 金: '死刑/争钱财', 土: '徒刑', 火: '血光', 木: '徒刑', 水: '水刑' }; points.push('人元' + gz + '五行主刑：' + (xf[g] || '')); }
      if (jx === '杂') points.push('课中无标准牢狱之象，宜观辰戌天罗地网');
      add('牢狱', '牢狱速断', points, jx);
    })();
    // 13. 来意：十二贵神主事
    (function () {
      var zhu = { 贵人: '家事、贵客至', 天乙: '家事、贵客至', 腾蛇: '见怪、忧惊', 朱雀: '口舌、官司、文书', 六合: '和合、亲财', 勾陈: '争田土、争斗', 青龙: '宜动求财、喜庆', 天空: '逃失、惊诈、虚事', 白虎: '内丧、兵信', 太常: '酒食、宴会', 玄武: '奸淫、贼欲', 太阴: '妇女、暗昧', 天后: '婚姻和合' };
      add('来意', '来意速断', ['贵神' + ke.gui.ganzhi + '（' + guiShen + '）主事：' + (zhu[guiShen] || guiShen), '以用爻定所求，参神将所主断来意'], '杂');
    })();
    // 14. 运程：神将与日时支生合吉、刑冲空亡凶
    (function () {
      var points = [], jx = '杂';
      var riZ = b.timeZhi, riZhiW = U.wuXingMap(riZ);
      if (SHENG[ke.gui.wx] === riZhiW || ZHI_HE[sz] === riZ) { points.push('贵神' + sz + '与占时' + riZ + '相生合：主时运吉'); jx = '吉'; }
      else if (ZHI_CHONG[sz] === riZ || isK(sz) || isSDK(sz)) { points.push('贵神与占时' + riZ + '刑冲/空亡：主时运凶'); jx = '凶'; }
      var dayGanWX = U.wuXingMap(b.dayGan);
      if (SHENG[dayGanWX] === ke.gui.wx || SHENG[dayGanWX] === ke.jiang.wx) points.push('日干' + b.dayGan + '生神将：无凶咎');
      else if (KE[ke.gui.wx] === dayGanWX || KE[ke.jiang.wx] === dayGanWX) { points.push('神将克日干' + b.dayGan + '：有凶来'); if (jx !== '吉') jx = '凶'; }
      if (wang(ke.yongShen)) points.push('用爻旺相：主运气佳');
      add('运程', '运程速断', points, jx);
    })();

    return out;
  }

  function calcRuShi() {
    var g = ke.renyuanWX, s = ke.gui.wx, j = ke.jiang.wx, f = ke.difenWX;
    var gz = ke.renyuan, sz = ke.gui.zhi, jz = ke.jiang.zhi, fz = ke.difen;
    var out = [];
    var count = {};
    [g, s, j, f].forEach(function (w) { count[w] = (count[w] || 0) + 1; });
    var wxs = ['木', '火', '土', '金', '水'];
    var rushiName = { 木: '二木为爻求难得', 火: '二火为灾百事残', 土: '二土比合迟晚看', 金: '二金刑克都无顺', 水: '二水皆为大吉象' };
    var rushiDet = { 木: '课中两木，求事多艰难，按人元贵神/贵神将神/将神地分见木分前中后', 火: '课中两火，百事凋残，多是非官灾火烧烫伤', 土: '课中两土，办事迟缓反复，迟晚乃成', 金: '课中两金，刑克不顺，见生则化解', 水: '课中两水多吉，尤水生人元则事成' };
    for (var w = 0; w < wxs.length; w++) { var w2 = wxs[w]; if ((count[w2] || 0) >= 2) out.push({ name: rushiName[w2], desc: rushiDet[w2], tag: (w2 === '水' ? '吉' : '凶') }); }
    var kePairNames = { '金木': '金入木乡忧口舌', '火金': '火临金位有屯迁', '木土': '木来入土为刑狱', '土水': '土行水上竞庄田', '水木': '水来入木', '木火': '木来生火' };
    var pairs = [[g, s, '人元', '贵神'], [s, j, '贵神', '将神'], [j, f, '将神', '地分'], [s, f, '贵神', '地分'], [g, j, '人元', '将神']];
    for (var k = 0; k < pairs.length; k++) {
      var a = pairs[k][0], bb = pairs[k][1];
      if (KE[a] === bb) {
        var key = a + bb;
        if (kePairNames[key]) out.push({ name: kePairNames[key], desc: a + '克' + bb + '（' + pairs[k][2] + '克' + pairs[k][3] + '），主口舌是非、艰难困阻，看克在何位断对应之事', tag: '凶' });
      }
    }
    // 上克下兮从外入 / 下克上兮向外迁（高级本 L471：人元克贵神、贵神克将神…重重自上克下）
    if (KE[g] === s && KE[s] === j) out.push({ name: '上克下兮从外入', desc: '人元' + gz + '克贵神' + sz + '、贵神克将神' + jz + '（重重自上克下' + (KE[j] === f ? '，将神' + jz + '又克地分' + fz : '') + '），主事从外入、外事牵连进门', tag: '凶' });
    if (KE[j] === s && KE[s] === g) out.push({ name: '下克上兮向外迁', desc: '将神' + jz + '克贵神' + sz + '、贵神克人元' + gz + '（重重自下克上' + (KE[f] === j ? '，地分' + fz + '又克将神' + jz : '') + '），主事从内起、向外迁移变动', tag: '凶' });
    if (KE[g] === s) out.push({ name: '客克主兮来索物', desc: '人元克贵神（客克主），外来索取欺内，占官司我败他胜', tag: '凶' });
    if (KE[s] === g) out.push({ name: '主克客兮客空还', desc: '贵神克人元（主克客，即官动），我主动出击可胜，占官司我胜他败', tag: '吉' });
    var allSheng = (SHENG[f] === j || f === j) && (SHENG[j] === s || j === s) && (SHENG[s] === g || s === g);
    if (allSheng) out.push({ name: '四位相生百事吉', desc: '四位相生（含比和），百事吉昌，内有刑克则忧患缠身', tag: '吉' });
    return out;
  }

  // ============ 渲染 ============
  function renderAll() {
    ke = calcKe(_state.solar, _state.difen, _state.jiang || null);
    calcShenSha();
    var sd = calcSanDong();
    var geju = calcGeJu();
    var rushi = calcRuShi();
    var keLing = calcKeLing();
    var fenlei = calcFenlei();
    _fenlei = fenlei;
    var solar = _state.solar;
    var lunar = solar.getLunar();
    var b = ke.bazi;
    var dayGZ = b.dayGan + b.dayZhi;
    var kongWang = U.xunKong(dayGZ);
    var wsCls = { 旺: 'wang', 相: 'xiang', 休: 'xiu', 囚: 'qiu', 死: 'si' };

    var h = '';

    // 出生信息
    h += '<div class="bazi-section">';
    h += '<div class="bazi-pillars">';
    var pGans = [b.yearGan, b.monthGan, b.dayGan, b.timeGan];
    var pZhis = [b.yearZhi, b.monthZhi, b.dayZhi, b.timeZhi];
    var ganToShiShen = {
      '甲甲': '比肩', '甲乙': '劫财', '甲丙': '食神', '甲丁': '伤官', '甲戊': '偏财', '甲己': '正财', '甲庚': '七杀', '甲辛': '正官', '甲壬': '偏印', '甲癸': '正印',
      '乙甲': '劫财', '乙乙': '比肩', '乙丙': '伤官', '乙丁': '食神', '乙戊': '正财', '乙己': '偏财', '乙庚': '正官', '乙辛': '七杀', '乙壬': '正印', '乙癸': '偏印',
      '丙甲': '偏印', '丙乙': '正印', '丙丙': '比肩', '丙丁': '劫财', '丙戊': '食神', '丙己': '伤官', '丙庚': '偏财', '丙辛': '正财', '丙壬': '七杀', '丙癸': '正官',
      '丁甲': '正印', '丁乙': '偏印', '丁丙': '劫财', '丁丁': '比肩', '丁戊': '伤官', '丁己': '食神', '丁庚': '正财', '丁辛': '偏财', '丁壬': '正官', '丁癸': '七杀',
      '戊甲': '七杀', '戊乙': '正官', '戊丙': '偏印', '戊丁': '正印', '戊戊': '比肩', '戊己': '劫财', '戊庚': '食神', '戊辛': '伤官', '戊壬': '偏财', '戊癸': '正财',
      '己甲': '正官', '己乙': '七杀', '己丙': '正印', '己丁': '偏印', '己戊': '劫财', '己己': '比肩', '己庚': '伤官', '己辛': '食神', '己壬': '正财', '己癸': '偏财',
      '庚甲': '偏财', '庚乙': '正财', '庚丙': '七杀', '庚丁': '正官', '庚戊': '偏印', '庚己': '正印', '庚庚': '比肩', '庚辛': '劫财', '庚壬': '食神', '庚癸': '伤官',
      '辛甲': '正财', '辛乙': '偏财', '辛丙': '正官', '辛丁': '七杀', '辛戊': '正印', '辛己': '偏印', '辛庚': '劫财', '辛辛': '比肩', '辛壬': '伤官', '辛癸': '食神',
      '壬甲': '食神', '壬乙': '伤官', '壬丙': '偏财', '壬丁': '正财', '壬戊': '七杀', '壬己': '正官', '壬庚': '偏印', '壬辛': '正印', '壬壬': '比肩', '壬癸': '劫财',
      '癸甲': '伤官', '癸乙': '食神', '癸丙': '正财', '癸丁': '偏财', '癸戊': '正官', '癸己': '七杀', '癸庚': '正印', '癸辛': '偏印', '癸壬': '劫财', '癸癸': '比肩'
    };
    for (var i = 0; i < 4; i++) {
      var ganShort = ganToShiShen[b.dayGan + pGans[i]] || '';
      var zhiW = U.wuXingMap(pZhis[i]);
      var pillarNames = ['年', '月', '日', '时'];
      var infoTypes = ['nian', 'yue', 'ri', 'shi'];
      h += '<div class="bazi-pillar">';
      h += '<div class="bazi-pillar-label">' + pillarNames[i] + '柱</div>';
      h += '<div class="bazi-pillar-gan" data-pillar="' + infoTypes[i] + '" data-type="gan" title="点击切换上一年/月/日/时辰">' + U.wuXingColor(pGans[i], 'span') + '</div>';
      h += '<div class="bazi-pillar-zhi" data-pillar="' + infoTypes[i] + '" data-type="zhi" title="点击切换下一年/月/日/时辰">' + U.wuXingColor(pZhis[i], 'span') + '</div>';
      h += '<div class="bazi-pillar-attr"><span>' + (pGans[i] === '甲' || pGans[i] === '丙' || pGans[i] === '戊' || pGans[i] === '庚' || pGans[i] === '壬' ? '阳' : '阴') + '</span> <span class="lbl">' + ganShort + '</span></div>';
      h += '<div class="bazi-pillar-attr"><span class="lbl">' + pZhis[i] + '</span>' + (zhiW || '') + ' <span class="lbl">' + (ganToShiShen[b.dayGan + '甲乙丙丁戊己庚辛壬癸'.charAt(ZHI.indexOf(pZhis[i]) % 10)] || '') + '</span></div>';
      h += '</div>';
    }
    h += '</div>';
    // 胎元命宫身宫
    var taiGan = GAN[(GAN.indexOf(b.monthGan) + 1) % 10];
    var taiZhi = ZHI[(ZHI.indexOf(b.monthZhi) + 3) % 12];
    var M = ({ 寅: 1, 卯: 2, 辰: 3, 巳: 4, 午: 5, 未: 6, 申: 7, 酉: 8, 戌: 9, 亥: 10, 子: 11, 丑: 12 })[b.monthZhi];
    var H = ZHI.indexOf(b.timeZhi);
    var mingGong = ZHI[(1 + M - H + 12) % 12];
    var shenGong = ZHI[(1 + M + H) % 12];
    h += '<div class="bazi-info"><span class="key">胎元</span>' + taiGan + taiZhi + ' <span class="key">命宫</span>' + mingGong + ' <span class="key">身宫</span>' + shenGong + ' <span class="key">空亡</span>' + kongWang + ' <span class="key">四大空亡</span>' + ke.sidakongwang + '</div>';
    h += '<div class="bazi-info"><span class="key">占时</span>' + U.wuXingColor(b.timeZhi, 'span') + ' <span class="key">月将</span>' + U.wuXingColor(ke.yuejiang, 'span') + '<span style="color:#999;font-size:1rem;">(' + (ke.yuejiangMethod || '') + ')</span>' + ' <span class="key">' + (ke.isDay ? '昼贵' : '夜贵') + '</span>' + U.wuXingColor(ke.guiRen, 'span') + (ke.isShun ? '顺' : '逆') + '<span style="color:#999;font-size:1rem;">(' + (ke.guiRenMethod || '') + ')</span>' + '</div>';
    h += '</div>';

    // 十二宫 + 中间四课（4x4 grid，中间合并区域 4 行竖排）
    h += '<div class="jkj-section">';
    h += '<div class="jkj-title">金口诀盘</div>';
    h += '<div class="jkj-pan">';
    var layout = [
      ['巳', '午', '未', '申'],
      ['辰', null, null, '酉'],
      ['卯', null, null, '戌'],
      ['寅', '丑', '子', '亥']
    ];
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < 4; c++) {
        var z = layout[r][c];
        if (!z) {
          if (r === 1 && c === 1) {
            h += '<div class="jkj-ke-wrap">';
            h += renderKeRow('人元', ke.renyuan, '', ke.renyuanWX + ke.renyuanYY, ke.wangShuai[ke.renyuan], wsCls, ke.yongShen === '人元');
            h += renderKeRow('贵神', ke.gui.ganzhi, ke.gui.shen, ke.gui.wx + ke.gui.yy, ke.wangShuai[ke.gui.zhi], wsCls, ke.yongShen === '贵神');
            h += renderKeRow('将神', ke.jiang.ganzhi, ke.jiang.name, ke.jiang.wx + ke.jiang.yy, ke.wangShuai[ke.jiang.zhi], wsCls, ke.yongShen === '将神');
            h += renderKeRow('地分', ke.difen, ke.difenDir, ke.difenWX + ke.difenYY, ke.wangShuai[ke.difen], wsCls, ke.yongShen === '地分');
            h += '</div>';
          }
          continue;
        }
        var act = z === ke.difen ? ' active' : '';
        var zidx = ZHI.indexOf(z);
        h += '<div class="jkj-cell' + act + '" data-zhi="' + z + '">';
        h += '<div class="zr">' + U.wuXingColor(z, 'span') + '</div>';
        h += '<div class="xi">' + DIRECTION[z] + '</div>';
        h += '<div class="attr">天盘' + U.wuXingColor(ke.tianPan[zidx], 'span') + '</div>';
        h += '<div class="attr">神盘' + U.wuXingColor(ke.shenPan[zidx], 'span') + '</div>';
        h += '</div>';
      }
    }
    h += '</div>';
    h += '<div style="font-size:1.1rem; color:#999; padding:4px 6px 0;">点击外框十二宫切换地分</div>';
    h += '</div>';

    // ===== 三动五动（课内四位生克，点击查看详解，神煞上方） =====
    h += '<div class="rs-section">';
    h += '<div class="ss-title">三动五动（课内四位生克，点击查看详解）</div>';
    h += '<div class="sd-line">';
    h += '<span class="sd-label">三动</span>';
    if (sd.sanDong.length) {
      for (var sd2 = 0; sd2 < sd.sanDong.length; sd2++) {
        var it2 = sd.sanDong[sd2];
        var cls2 = it2.name === '兄弟动' ? 'geju-za' : 'geju-ji';
        h += '<span class="geju-item ' + cls2 + ' geju-click" data-desc="<b>' + it2.name + '</b>：' + it2.left + it2.leftGZ + '（' + it2.leftWX + '）' + it2.cond + it2.right + it2.rightGZ + '（' + it2.rightWX + '）<br><br><b>断语：</b>' + (SANDONG_GJ[it2.name] || '') + '">' + it2.name + '</span>';
      }
    } else { h += '<span class="desc">无生比</span>'; }
    h += '<span class="sd-label">五动</span>';
    if (sd.wuDong.length) {
      for (var wd = 0; wd < sd.wuDong.length; wd++) {
        var it = sd.wuDong[wd];
        var cls = (it.name === '财动' || it.name === '官动') ? 'geju-ji' : 'geju-xiong';
        h += '<span class="geju-item ' + cls + ' geju-click" data-desc="<b>' + it.name + '</b>：' + it.left + it.leftGZ + '（' + it.leftWX + '）' + it.cond + it.right + it.rightGZ + '（' + it.rightWX + '）<br><br><b>断语：</b>' + (WUDONG_GJ[it.name] || '') + '">' + it.name + '</span>';
      }
    } else { h += '<span class="desc">课内无相克</span>'; }
    h += '</div>';
    h += '</div>';

    // ===== 神煞（按四位分布，书第六章） =====
    h += '<div class="ss-section">';
    h += '<div class="ss-title">神煞（按四位分布，点击查看取法）</div>';
    h += renderShenShaByWei();
    h += '</div>';

    // ===== 课体速断（入式歌，书第十三章） =====
    h += '<div class="rs-section">';
    h += '<div class="ss-title">课体速断（入式歌）</div>';
    if (rushi.length) {
      h += '<div class="geju-wrap">';
      for (var rs = 0; rs < rushi.length; rs++) {
        h += '<span class="geju-item ' + (rushi[rs].tag === '凶' ? 'geju-xiong' : 'geju-ji') + ' geju-click" data-desc="' + rushi[rs].desc + '">' + rushi[rs].name + '</span>';
      }
      h += '</div>';
    } else {
      h += '<div class="ss-row"><span class="desc">无（可依五行生克细断）</span></div>';
    }
    h += '</div>';

    // ===== 格局（书第十二章） =====
    h += '<div class="rs-section">';
    h += '<div class="ss-title">格局（点击查看详解）</div>';
    if (geju.length) {
      h += '<div class="geju-wrap">';
      for (var gj = 0; gj < geju.length; gj++) {
        h += '<span class="geju-item ' + (geju[gj].tag === '凶' ? 'geju-xiong' : (geju[gj].tag === '杂' ? 'geju-za' : 'geju-ji')) + ' geju-click" data-desc="' + geju[gj].desc + '">' + geju[gj].name + '</span>';
      }
      h += '</div>';
    } else {
      h += '<div class="ss-row"><span class="desc">无成格</span></div>';
    }
    h += '</div>';

    // ===== 六十四课铃（刘柏林，点击查看详解） =====
    h += '<div class="rs-section">';
    h += '<div class="ss-title">六十四课铃（刘柏林，点击查看详解）</div>';
    if (keLing.length) {
      h += '<div class="geju-wrap">';
      for (var kl = 0; kl < keLing.length; kl++) {
        h += '<span class="geju-item ' + (keLing[kl].tag === '凶' ? 'geju-xiong' : (keLing[kl].tag === '杂' ? 'geju-za' : 'geju-ji')) + ' geju-click" data-desc="' + keLing[kl].desc + '">' + keLing[kl].name + '</span>';
      }
      h += '</div>';
    } else {
      h += '<div class="ss-row"><span class="desc">无课铃成格</span></div>';
    }
    h += '</div>';

    // ===== 分类断（问事速断，依据课内算法，点击查看结论） =====
    h += '<div class="fl-section">';
    h += '<div class="ss-title">分类断（问事速断，点击查看结论）</div>';
    h += '<div class="fl-wrap">';
    for (var fl = 0; fl < fenlei.length; fl++) {
      h += '<span class="fl-item ' + (fenlei[fl].jixiong === '凶' ? 'fl-xiong' : (fenlei[fl].jixiong === '吉' ? 'fl-ji' : 'fl-za')) + ' fenlei-click" data-fl="' + fl + '">' + fenlei[fl].key + '</span>';
    }
    h += '</div>';
    h += '</div>';

    $('#content').html(h);
    bindAll();
  }

  function renderKeRow(name, gz, gn, wxYY, ws, wsCls, isYong) {
    var h = '<div class="jkj-ke' + (gn ? ' jkj-shen' : '') + '"' + (gn ? ' data-shen="' + gn + '"' : '') + '>';
    h += '<span class="name">' + name + (isYong ? '（用）' : '') + '</span>';
    h += '<span class="gz">' + U.wuXingColor(gz, 'span') + '</span>';
    if (gn) h += '<span class="gn">' + gn + '</span>';
    h += '<span class="wxyy">' + (wxYY || '') + '</span>';
    h += '<span class="ws ' + (wsCls[ws] || '') + '">' + (ws || '') + '</span>';
    h += '</div>';
    return h;
  }

  // 弹窗显示（格局/入式歌/神将释义）
  function showDesc(title, desc) {
    var $m = $('#jkl-modal');
    if (!$m.length) {
      $('body').append('<div id="jkl-modal" class="jkl-modal" style="display:none;"><div class="jkl-modal-mask"></div><div class="jkl-modal-box"><div class="jkl-modal-head"><span class="jkl-modal-title"></span><span class="jkl-modal-close">×</span></div><div class="jkl-modal-body"></div></div></div>');
      $m = $('#jkl-modal');
      $m.off('click.mask').on('click.mask', '.jkl-modal-mask', function () { $m.hide(); });
      $m.off('click.close').on('click.close', '.jkl-modal-close', function () { $m.hide(); });
    }
    $m.find('.jkl-modal-title').text(title);
    $m.find('.jkl-modal-body').html(desc);
    $m.show();
  }

  // 神煞渲染：maxShow 限制条数，其余折叠（点击展开）
  function renderShenShaList(list, maxShow) {
    if (!list.length) return '';
    var h = '';
    var groups = { 吉: [], 凶: [], 杂: [] };
    for (var i = 0; i < list.length; i++) (groups[list[i].tag] = groups[list[i].tag] || []).push(list[i]);
    var order = ['吉', '凶', '杂'];
    var total = 0;
    for (var g = 0; g < order.length; g++) total += (groups[order[g]] || []).length;
    // maxShow: null/undefined=全部显示; 0=全部折叠; N>0=显示N条
    var shown = 0;
    for (var g = 0; g < order.length; g++) {
      var grp = groups[order[g]];
      if (!grp || !grp.length) continue;
      for (var j = 0; j < grp.length; j++) {
        var hidden = (typeof maxShow === 'number') && shown >= maxShow;
        var it = grp[j];
        h += '<div class="ss-row' + (hidden ? ' ss-more' : '') + '"' + (hidden ? ' style="display:none;"' : '') + '>';
        h += '<span class="name">' + it.name + '</span>';
        var hits = it.hit ? ' <span class="tag">' + it.hit + '</span>' : '';
        h += '<span class="desc">' + it.val + hits + '</span>';
        h += '</div>';
        shown++;
      }
    }
    // 折叠按钮（仅当有隐藏项时）
    if (typeof maxShow === 'number' && total > maxShow) {
      var hideCnt = total - Math.min(maxShow, total);
      h += '<div class="ss-more-btn" data-state="closed" data-cnt="' + hideCnt + '" style="cursor:pointer;color:#b98c51;font-size:1.15rem;padding:4px 0;text-align:center;">展开全部神煞（' + hideCnt + '）▾</div>';
    }
    return h;
  }

  // 神煞按四位分布渲染（人元/贵神/将神/地分 四行，常见优先、超6折叠）
  function renderShenShaByWei() {
    var WEI = ['人元', '贵神', '将神', '地分'];
    var MAX = 6;
    var h = '';
    for (var w = 0; w < WEI.length; w++) {
      var wei = WEI[w];
      var items = P.filter(function (it) { return it.hitArr.indexOf(wei) >= 0; });
      var ordered = items.filter(function (it) { return isCommon(it.name); }).concat(items.filter(function (it) { return !isCommon(it.name); }));
      if (!ordered.length) { h += '<div class="ss-row wei-row"><span class="name">' + wei + '神煞</span><span class="desc">—</span></div>'; continue; }
      h += '<div class="ss-row wei-row"><span class="name">' + wei + '神煞</span>';
      for (var i = 0; i < ordered.length; i++) {
        var it = ordered[i];
        var hidden = i >= MAX;
        var cls = 'wei-item ' + (it.tag === '吉' ? 'wei-ji' : (it.tag === '凶' ? 'wei-xiong' : 'wei-za')) + (hidden ? ' wei-more' : '');
        h += '<span class="' + cls + '"' + (hidden ? ' style="display:none;"' : '') + ' data-desc="' + it.val + '">' + it.name + '</span>';
      }
      if (ordered.length > MAX) h += '<span class="wei-expand" data-state="closed">▾</span>';
      h += '</div>';
    }
    return h;
  }

  function bindAll() {
    $('#content').off('click.cell', '.jkj-cell').on('click.cell', '.jkj-cell', function () {
      var z = $(this).attr('data-zhi');
      if (!z || z === _state.difen) return;
      _state.difen = z;
      renderAll();
    });

    // 神煞展开/折叠按钮
    $('#content').off('click.ssmore', '.ss-more-btn').on('click.ssmore', '.ss-more-btn', function () {
      var $btn = $(this);
      var $wrap = $btn.closest('.ss-section');
      var isOpen = $btn.attr('data-state') === 'open';
      var cnt = $btn.attr('data-cnt') || '';
      $wrap.find('.ss-row.ss-more').css('display', isOpen ? 'none' : '');
      $btn.attr('data-state', isOpen ? 'closed' : 'open');
      $btn.text(isOpen ? ('展开全部神煞（' + cnt + '）▾') : '收起神煞▴');
    });

    // 八字柱点击增减（干/支 → 上下一年/月/日/时辰）
    $('#content').off('click.pillar', '.bazi-pillar-gan, .bazi-pillar-zhi').on('click.pillar', '.bazi-pillar-gan, .bazi-pillar-zhi', function () {
      if (!_state) return;
      var s = _state.solar;
      var pillar = $(this).attr('data-pillar');
      var type = $(this).attr('data-type');
      var delta = type === 'gan' ? -1 : 1;
      var y = s.getYear(), m = s.getMonth(), d = s.getDay(), h = s.getHour(), mi = s.getMinute();
      var newV = null;
      if (pillar === 'nian') {
        newV = (y + delta) + U.pad(m) + U.pad(d) + U.pad(h) + U.pad(mi);
      } else if (pillar === 'yue') {
        var mm = m + delta;
        var yy = y;
        if (mm < 1) { mm = 12; yy -= 1; }
        if (mm > 12) { mm = 1; yy += 1; }
        newV = yy + U.pad(mm) + U.pad(d) + U.pad(h) + U.pad(mi);
      } else if (pillar === 'ri') {
        // 用 Julian 日增减确保跨月/跨年正确
        var jul = s.getJulianDay() + delta;
        var ns = Solar.fromJulianDay(jul);
        newV = ns.getYear() + U.pad(ns.getMonth()) + U.pad(ns.getDay()) + U.pad(ns.getHour()) + U.pad(ns.getMinute());
      } else if (pillar === 'shi') {
        var nh = h + delta * 2; // 一个时辰=2小时
        if (nh < 0) nh += 24;
        if (nh >= 24) nh -= 24;
        newV = y + U.pad(m) + U.pad(d) + U.pad(nh) + U.pad(mi);
      }
      if (!newV) return;
      var suffix = $('#gender_man').prop('checked') ? '+' : '-';
      $('#input').val(newV + suffix);
      sync(newV + suffix);
      updateBirthTitle();
    });

    // 格局/入式歌点击 → 弹窗详解
    $('#content').off('click.geju', '.geju-click').on('click.geju', '.geju-click', function () {
      showDesc($(this).text().trim(), $(this).attr('data-desc') || '');
    });

    // 分类断点击 → 弹窗显示算法结论
    $('#content').off('click.fl', '.fenlei-click').on('click.fl', '.fenlei-click', function () {
      var idx = parseInt($(this).attr('data-fl'), 10);
      var it = _fenlei[idx];
      if (!it) return;
      var html = '<div style="margin-bottom:6px;">吉凶：<b style="color:' + (it.jixiong === '凶' ? '#c0392b' : (it.jixiong === '吉' ? '#1d6b1d' : '#7a5c2e')) + '">' + (it.jixiong === '凶' ? '凶' : (it.jixiong === '吉' ? '吉' : '平')) + '</b></div>';
      html += '<ul style="margin:0; padding-left:18px;">';
      for (var i = 0; i < it.points.length; i++) html += '<li style="margin:4px 0;">' + it.points[i] + '</li>';
      html += '</ul>';
      showDesc(it.title, html);
    });

    // 神煞条目点击 → 取法 + 书中释义
    $('#content').off('click.wei', '.wei-item').on('click.wei', '.wei-item', function () {
      var nm = $(this).text();
      var desc = $(this).attr('data-desc') || '';
      var explain = SHEN_DESC[nm];
      showDesc(nm, desc + (explain ? '<br><br><b>释义：</b>' + explain : ''));
    });
    // 神煞行展开/折叠
    $('#content').off('click.weixp', '.wei-expand').on('click.weixp', '.wei-expand', function () {
      var $row = $(this).closest('.wei-row');
      var isOpen = $(this).attr('data-state') === 'open';
      $row.find('.wei-item.wei-more').css('display', isOpen ? 'none' : '');
      $(this).attr('data-state', isOpen ? 'closed' : 'open');
      $(this).text(isOpen ? '▾' : '▴');
    });

    // 贵神/将神点击 → 释义弹窗
    $('#content').off('click.shenyi', '.jkj-shen').on('click.shenyi', '.jkj-shen', function () {
      var nm = $(this).attr('data-shen');
      if (!nm) return;
      var desc = GUI_DESC[nm] || JIANG_DESC[nm];
      if (desc) showDesc(nm + '释义', desc);
    });
  }

  function updateBirthTitle() {
    if (!_state) return;
    var s = _state.solar;
    var lunar = s.getLunar();
    $('#birth-title').text(s.getYear() + '年' + s.getMonth() + '月' + s.getDay() + '日(' + lunar.getMonthInChinese() + '月' + lunar.getDayInChinese() + ')' + U.pad(s.getHour()) + ':' + U.pad(s.getMinute()));
  }

  // ============ 对外同步 ============
  function sync(vStr) {
    var solar = parseInput(vStr);
    if (!solar) return;
    if (!_state || !_state.difen) {
      var lunar = solar.getLunar();
      var bazi = lunar.getEightChar();
      bazi.setSect(1);
      var df = bazi.getTimeZhi() || '子';
      // 罗盘联动：URL 参数 difen 优先（罗盘页跳转），其次 localStorage（备用）
      var fromUrl = false;
      try {
        var p = new URLSearchParams(location.search);
        var dp = p.get('difen');
        if (dp && '子丑寅卯辰巳午未申酉戌亥'.indexOf(dp) >= 0) { df = dp; fromUrl = true; }
      } catch (e) {}
      if (!fromUrl) {
        try {
          var cd = localStorage.getItem('compass_difen');
          if (cd && '子丑寅卯辰巳午未申酉戌亥'.indexOf(cd) >= 0) {
            df = cd;
            localStorage.removeItem('compass_difen'); // 用一次即清除
          }
        } catch (e) {}
      }
      // 自定义月将：URL 参数 jiang 或 UI 下拉（'auto'=按中气；'richen'=日缠校正；或 12 将）
      var jiang = null;
      try {
        var pj = new URLSearchParams(location.search);
        var dj = pj.get('jiang');
        if (dj === 'auto' || !dj) { jiang = null; }
        else if (dj === 'richen') { jiang = 'richen'; }
        else if ('子丑寅卯辰巳午未申酉戌亥'.indexOf(dj) >= 0) { jiang = dj; }
      } catch (e) {}
      if (!jiang && $('#jiang-sel').length && $('#jiang-sel').val() !== 'auto') {
        var vj = $('#jiang-sel').val();
        if (vj === 'richen') jiang = 'richen';
        else if ('子丑寅卯辰巳午未申酉戌亥'.indexOf(vj) >= 0) jiang = vj;
      }
      // 天后地支：URL 参数 tianhou 或 UI 下拉（'亥'=金口诀玄武子，'子'=大六壬玄武亥）
      var th = '亥';
      try {
        var pt = pj.get('tianhou');
        if (pt === '子') th = '子';
      } catch (e) {}
      if ($('#tianhou-sel').length && $('#tianhou-sel').val() === '子') th = '子';
      // 天乙贵人：URL 参数 guiren 或 UI 下拉（default=昼夜顺逆；guolao=果老落宫定顺逆）
      var gr = null;
      try {
        var pg2 = pj.get('guiren');
        if (pg2 === 'guolao') gr = 'guolao';
      } catch (e) {}
      if ($('#guiren-sel').length && $('#guiren-sel').val() === 'guolao') gr = 'guolao';
      _state = { solar: solar, difen: df, jiang: jiang, tianhou: th, guiren: gr };
    } else {
      _state.solar = solar;
    }
    // 同步月将/天后下拉显示
    if ($('#jiang-sel').length) {
      $('#jiang-sel').val(_state.jiang ? _state.jiang : 'auto');
    }
    if ($('#tianhou-sel').length) {
      $('#tianhou-sel').val(_state.tianhou || '亥');
    }
    if ($('#guiren-sel').length) {
      $('#guiren-sel').val(_state.guiren === 'guolao' ? 'guolao' : 'default');
    }
    renderAll();
  }

  function reroll() {
    if (!_state) return;
    var zhis = ZHI.split('');
    _state.difen = zhis[Math.floor(Math.random() * 12)];
    renderAll();
  }

  // 初始化
  $(function () {
    var params = new URLSearchParams(location.search);
    var v = params.get('v') || '';
    if (!v) {
      var now = Solar.fromDate(new Date());
      v = now.toYmdHms().replace(/[- :]/gim, '').substr(0, 12);
    }
    var gParam = params.get('gender');
    if (gParam === '0') $('#gender_woman').prop('checked', true);
    var suffix = $('#gender_man').prop('checked') ? '+' : '-';
    $('#input').val(String(v).replace(/[^\d]/g, '') + suffix);
    sync(v + suffix);

    var s = _state.solar;
    var lunar = s.getLunar();
    $('#birth-title').text(s.getYear() + '年' + s.getMonth() + '月' + s.getDay() + '日(' + lunar.getMonthInChinese() + '月' + lunar.getDayInChinese() + ')' + U.pad(s.getHour()) + ':' + U.pad(s.getMinute()));

    $('#input').on('input.jkj', function () { sync($(this).val()); });
    $('input[name=gender], #sect').on('change.jkj', function () { sync($('#input').val()); });
    // 月将切换（auto=中气自动；richen=日缠校正；或 12 将自定义）
    $('#jiang-sel').on('change.jkj', function () {
      var v = $(this).val();
      if (v === 'auto') { _state.jiang = null; }
      else if (v === 'richen') { _state.jiang = 'richen'; }
      else if ('子丑寅卯辰巳午未申酉戌亥'.indexOf(v) >= 0) { _state.jiang = v; }
      renderAll();
    });
    // 天后地支切换（亥=金口诀玄武子；子=大六壬玄武亥）
    $('#tianhou-sel').on('change.jkj', function () {
      var v = $(this).val();
      _state.tianhou = (v === '子') ? '子' : '亥';
      renderAll();
    });
    // 天乙贵人切换（default=昼夜顺逆；guolao=果老落宫定顺逆）
    $('#guiren-sel').on('change.jkj', function () {
      var v = $(this).val();
      _state.guiren = (v === 'guolao') ? 'guolao' : null;
      renderAll();
    });
    $('#now-btn').on('click', function () {
      var now = Solar.fromDate(new Date());
      var v2 = now.toYmdHms().replace(/[- :]/gim, '').substr(0, 12);
      var g = $('#gender_man').prop('checked') ? '+' : '-';
      $('#input').val(v2 + g);
      sync(v2 + g);
    });
    $('#menu-btn').on('click', function () {
      $('#control-panel').toggle();
    });
    $('#reroll-btn').on('click', reroll);
    // 复制排盘 / AI 分析
    $('#jk-copy-btn').on('click', function () { if (ke) clipCopy(jkCopy(), this); });
    $('#jk-ai-btn').on('click', function () { if (ke) clipCopy(jkAI(), this); });
  });

  // ============ 复制排盘 / AI 分析 ============
  function clipCopy(text, btn) {
    function ok() { if (btn) { var o = btn.textContent; btn.textContent = '已复制✓'; setTimeout(function () { btn.textContent = o; }, 1200); } }
    function fb() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (e) {}
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok).catch(fb);
    else fb();
  }
  function jkBirth() {
    var s = _state.solar, l = s.getLunar();
    return '北京时间' + s.getYear() + '年' + s.getMonth() + '月' + s.getDay() + '日 ' + U.pad(s.getHour()) + ':' + U.pad(s.getMinute()) + '（农历' + l.getMonthInChinese() + '月' + l.getDayInChinese() + '）';
  }
  function jkGanZhi() {
    var b = ke.bazi;
    var kw = U.xunKong(b.dayGan + b.dayZhi);
    var sdk = ke.sidakongwang;
    return b.yearGan + b.yearZhi + ' ' + b.monthGan + b.monthZhi + ' ' + b.dayGan + b.dayZhi + ' ' + b.timeGan + b.timeZhi + '  ' + kw + '空' + (sdk !== '无' ? ' ' + sdk + '空' : '');
  }
  function jkSiwei() {
    function mark(pos) { return ke.yongShen === pos ? ' 用神' : ''; }
    return '人元：' + ke.renyuan + '（' + ke.renyuanWX + '·' + ke.wangShuai[ke.renyuan] + '）' + mark('人元') + '\n' +
      '贵神：' + ke.gui.ganzhi + ' ' + ke.gui.shen + '（' + ke.gui.wx + '·' + ke.wangShuai[ke.gui.zhi] + '）' + mark('贵神') + '\n' +
      '将神：' + ke.jiang.ganzhi + ' ' + ke.jiang.name + '（' + ke.jiang.wx + '·' + ke.wangShuai[ke.jiang.zhi] + '）' + mark('将神') + '\n' +
      '地分：' + ke.difen + '（' + ke.difenWX + '·' + ke.wangShuai[ke.difen] + '）' + mark('地分');
  }
  function jkSandong() {
    var sd = calcSanDong();
    return '三动：' + (sd.sanDong.length ? sd.sanDong.map(function (d) { return d.name + '(' + d.left + d.leftGZ + d.cond + d.right + d.rightGZ + ')'; }).join('、') : '无') + '\n' +
      '五动：' + (sd.wuDong.length ? sd.wuDong.map(function (d) { return d.name + '(' + d.left + d.leftGZ + d.cond + d.right + d.rightGZ + ')'; }).join('、') : '无');
  }
  function jkShensha() {
    var WEI = ['人元', '贵神', '将神', '地分'];
    var lines = [];
    for (var w = 0; w < WEI.length; w++) {
      var items = P.filter(function (it) { return it.hitArr.indexOf(WEI[w]) >= 0; }).map(function (it) { return it.name; });
      lines.push(WEI[w] + '神煞：' + (items.length ? items.join('、') : '无'));
    }
    return lines.join('\n');
  }
  function jkGeju() {
    var rs = calcRuShi(), gj = calcGeJu(), kl = calcKeLing(), fl = calcFenlei();
    var parts = [];
    if (rs.length) parts.push('课体速断：' + rs.map(function (x) { return x.name + '：' + x.desc; }).join('\n'));
    if (gj.length) parts.push('格局：' + gj.map(function (x) { return x.name + '：' + x.desc; }).join('\n'));
    if (kl.length) parts.push('六十四课铃：' + kl.map(function (x) { return x.name + '：' + x.desc; }).join('\n'));
    if (fl.length) parts.push('分类断：' + fl.map(function (x) { return x.key + '（' + (x.jixiong === '凶' ? '凶' : (x.jixiong === '吉' ? '吉' : '平')) + '）：' + x.points.join('；'); }).join('\n'));
    return parts.join('\n\n');
  }
  var JK_AI_PROMPT = '你是一位精通大六壬金口诀的资深命理师，请基于以上课体数据（已由程序排定，勿自行起课/重排）进行断课分析，按以下步骤分点输出：\n1. 定用爻、判旺衰与空亡；\n2. 解三动五动各主何事；\n3. 释格局、六十四课铃与神煞含义；\n4. 综合断所问事之吉凶与应期。专业术语请加白话括注。';
  function jkCopy() {
    return '【金口诀排盘】' + jkBirth() + '\n' + jkGanZhi() + '\n\n【四位】\n' + jkSiwei() + '\n\n【三动五动】\n' + jkSandong() + '\n\n【四位神煞】\n' + jkShensha();
  }
  function jkAI() {
    return '【金口诀排盘数据】\n' + jkBirth() + '\n' + jkGanZhi() + '\n\n【四位】\n' + jkSiwei() + '\n\n【三动五动】\n' + jkSandong() + '\n\n【四位神煞】\n' + jkShensha() + '\n\n【格局与断课】\n' + jkGeju() + '\n\n' + JK_AI_PROMPT;
  }

  window.Jinkoujue = { sync: sync, calcKe: calcKe, calcSanDong: calcSanDong, calcWangShuai: calcWangShuai, copyPan: jkCopy, copyAI: jkAI };
})();
