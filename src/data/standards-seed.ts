import type { StandardClause, StandardQuickRef } from '../services/data.service';

const VERIFIED_AT = '2026-06-29';
const OPEN_STD = 'https://openstd.samr.gov.cn/bzgk/std/index';
const STD_PLATFORM = 'https://std.samr.gov.cn/';
const MOHURD_DOCS = 'https://www.mohurd.gov.cn/gongkai/zc/wjk/';

const jianbiaoku = (code: string) => `http://s.jianbiaoku.com/sou/?module=criterion&keyword=${encodeURIComponent(code)}`;
const soujianzhu = (code: string) => `https://www.soujianzhu.cn/NormAndRules/Default.aspx?key=${encodeURIComponent(code)}`;

const GB55019_PDF = 'https://snamr.shaanxi.gov.cn/sy/ztzl/sbgxhxfpyjhx/bzcx/gjbz/202410/P020250320617603414157.pdf';
const GB55031_CABR = 'https://gf.cabr-fire.com/m/list-1535.htm';
const GB55036_CABR = 'https://gf.cabr-fire.com/m/list-1534.htm';
const GB55037_CABR = 'https://gf.cabr-fire.com/m/list-1538.htm';
const GB55038_CABR = 'https://gf.cabr-fire.com/m/list-2369.htm';
const GB55038_MOHURD_ARTICLE = 'https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2025/art_66adac27fa2144bb86f98fe4c297efd6.html';
const GB55020_CABR = 'https://gf.cabr-fire.com/m/list-1383.htm';
const GB55015_CABR = 'https://gf.cabr-fire.com/m/list-1418.htm';
const GB50352_PDF = 'https://pyso.newswz.cn/upload/202207/202207141825456611.pdf';
const GB50096_PDF = 'https://www.jyecorp.com/static/upload/file/20220301/1646097115511615.pdf';
const GB50067_CABR = 'https://gf.cabr-fire.com/m/list-176.htm';
const GB50015_CABR = 'https://gf.cabr-fire.com/m/list-1112.htm';
const JGJ100_SOURCE = 'https://zrzyghj.chizhou.gov.cn/InFeedback/show/56283.html';
const GB50034_PDF = 'https://www.taiyifire.com/uploads/file/20191111/15/d760e689f87f72358c7b63c05f8259dd.pdf';

const officialUrls = (code: string, extra: string[] = []) => [
  OPEN_STD,
  STD_PLATFORM,
  MOHURD_DOCS,
  ...extra,
  jianbiaoku(code),
  soujianzhu(code)
];

type ClauseDraft = Omit<
  StandardClause,
  'id' | 'standardCode' | 'standardTitle' | 'sourceName' | 'sourceUrl' | 'verifiedAt'
> & {
  id: string;
  sourceName?: string;
  sourceUrl?: string;
  verifiedAt?: string;
};

type StandardDraft = Omit<StandardQuickRef, 'clauses'> & {
  sourceName: string;
  sourceUrl: string;
  clauses: ClauseDraft[];
};

const standard = (item: StandardDraft): StandardQuickRef => ({
  id: item.id,
  title: item.title,
  code: item.code,
  status: item.status,
  effectiveDate: item.effectiveDate,
  category: item.category,
  useCases: item.useCases,
  keywords: item.keywords,
  officialUrls: item.officialUrls,
  verifiedAt: item.verifiedAt,
  note: item.note,
  clauses: item.clauses.map(clause => ({
    ...clause,
    id: `${item.id}-${clause.id}`,
    standardCode: item.code,
    standardTitle: item.title,
    sourceName: clause.sourceName ?? item.sourceName,
    sourceUrl: clause.sourceUrl ?? item.sourceUrl,
    verifiedAt: clause.verifiedAt ?? item.verifiedAt
  }))
});

export const SEED_STANDARDS: StandardQuickRef[] = [
  standard({
    id: 'gb55031-2022',
    title: '民用建筑通用规范',
    code: 'GB 55031-2022',
    status: '现行强制性工程建设规范',
    effectiveDate: '2023-03-01',
    category: '民用建筑',
    useCases: ['楼梯', '栏杆', '净高', '建筑面积', '儿童活动场所', '退距'],
    keywords: ['民用建筑', '楼梯', '栏杆', '净高', '建筑面积', '红线', '退距'],
    officialUrls: officialUrls('GB 55031-2022', [
      GB55031_CABR,
      'https://www.cari.net.cn/gjbz/53.html',
      'https://www.cari.net.cn/static/upload/file/20220927/1664256190101533.pdf'
    ]),
    verifiedAt: VERIFIED_AT,
    note: '用于民用建筑通用强制要求初查；地方规划退距、日照间距、消防审查口径仍以项目所在地规划条件和正式审查为准。',
    sourceName: 'CABR规范库',
    sourceUrl: GB55031_CABR,
    clauses: [
      {
        id: 'indoor-clear-height',
        clauseNo: '3.2.7',
        category: '净高',
        title: '有人员正常活动空间最低净高',
        appliesTo: '地下室、局部夹层、公共走道、避难区、架空层等有人员正常活动的空间。',
        requirement: '上述空间最低处室内净高不应小于2.00m；用于主要功能的房间还应满足对应建筑类型的更高净高要求。',
        numericValues: ['2.00m'],
        keywords: ['净高', '地下室', '走道', '架空层', '避难区']
      },
      {
        id: 'public-stair-platform-width',
        clauseNo: '5.3.5',
        category: '楼梯',
        title: '公共楼梯转向平台宽度',
        appliesTo: '公共楼梯梯段改变方向处的平台。',
        requirement: '楼梯休息平台最小宽度不应小于梯段净宽，且不应小于1.20m；有中间实体墙时，扶手转向端平台净宽不应小于1.30m。',
        numericValues: ['1.20m', '1.30m'],
        keywords: ['楼梯平台', '平台宽度', '梯段净宽']
      },
      {
        id: 'straight-stair-middle-platform',
        clauseNo: '5.3.5',
        category: '楼梯',
        title: '直跑楼梯中间平台宽度',
        appliesTo: '公共直跑楼梯中间休息平台。',
        requirement: '直跑楼梯中间平台宽度不应小于0.90m。',
        numericValues: ['0.90m'],
        keywords: ['直跑楼梯', '中间平台', '平台宽度']
      },
      {
        id: 'stair-door-distance',
        clauseNo: '5.3.6',
        category: '楼梯',
        title: '楼梯间门距踏步边缘',
        appliesTo: '公共楼梯正对向上或向下梯段设置楼梯间门的情况。',
        requirement: '楼梯间门距踏步边缘的距离不应小于0.60m。',
        numericValues: ['0.60m'],
        keywords: ['楼梯间门', '踏步边缘', '门距']
      },
      {
        id: 'stair-clear-height',
        clauseNo: '5.3.7',
        category: '楼梯',
        title: '公共楼梯平台和梯段净高',
        appliesTo: '公共楼梯休息平台上部、下部过道和梯段。',
        requirement: '楼梯休息平台上部及下部过道处净高不应小于2.00m，梯段净高不应小于2.20m。',
        numericValues: ['2.00m', '2.20m'],
        keywords: ['楼梯净高', '平台净高', '梯段净高']
      },
      {
        id: 'stair-step-count',
        clauseNo: '5.3.8',
        category: '楼梯',
        title: '公共楼梯每梯段踏步级数',
        appliesTo: '公共楼梯每个梯段。',
        requirement: '每个梯段踏步级数不应少于2级，且不应超过18级。',
        numericValues: ['2级', '18级'],
        keywords: ['踏步级数', '楼梯', '梯段']
      },
      {
        id: 'fan-step-width',
        clauseNo: '5.3.9',
        category: '楼梯',
        title: '螺旋楼梯和扇形踏步最小踏面',
        appliesTo: '螺旋楼梯和扇形踏步。',
        requirement: '离内侧扶手中心0.25m处的踏步宽度不应小于0.22m。',
        numericValues: ['0.25m', '0.22m'],
        keywords: ['螺旋楼梯', '扇形踏步', '踏步宽度']
      },
      {
        id: 'stair-step-consistency',
        clauseNo: '5.3.10',
        category: '楼梯',
        title: '相邻梯段踏步高度差',
        appliesTo: '同一楼梯的各梯段踏步。',
        requirement: '每个楼梯的踏步高度、宽度应一致，相邻梯段踏步高度差不应大于0.01m，踏步面应采取防滑措施。',
        numericValues: ['0.01m'],
        keywords: ['踏步高度', '防滑', '高度差']
      },
      {
        id: 'children-stairwell',
        clauseNo: '5.3.11',
        category: '儿童安全',
        title: '少年儿童活动场所楼梯井防坠',
        appliesTo: '托儿所、幼儿园、中小学校及其他少年儿童专用活动场所的公共楼梯井。',
        requirement: '当公共楼梯井净宽大于0.20m时，应采取防止少年儿童坠落的措施。',
        numericValues: ['0.20m'],
        keywords: ['儿童', '楼梯井', '防坠落', '学校', '幼儿园']
      },
      {
        id: 'guardrail-height',
        clauseNo: '6.6.1',
        category: '栏杆',
        title: '临空栏杆基本高度',
        appliesTo: '阳台、外廊、室内回廊、中庭、内天井、上人屋面及楼梯等临空部位。',
        requirement: '临空部位应设置防护栏杆，栏杆或栏板垂直高度不应小于1.10m。',
        numericValues: ['1.10m'],
        keywords: ['栏杆', '栏板', '临空', '上人屋面']
      },
      {
        id: 'guardrail-measure',
        clauseNo: '6.6.1',
        category: '栏杆',
        title: '栏杆高度起算位置',
        appliesTo: '底部存在可踏面的栏杆或栏板。',
        requirement: '栏杆高度按楼地面或屋面至扶手顶面计算；若底部有宽度不小于0.22m且高度不大于0.45m的可踏部位，应从可踏部位顶面起算。',
        numericValues: ['0.22m', '0.45m'],
        keywords: ['可踏面', '栏杆起算', '扶手顶面']
      },
      {
        id: 'guardrail-gap',
        clauseNo: '6.6.1',
        category: '栏杆',
        title: '栏杆底部不宜留空',
        appliesTo: '临空栏杆底部。',
        requirement: '栏杆离底面0.10m高度范围内不宜留空，避免物品坠落或儿童误入。',
        numericValues: ['0.10m'],
        keywords: ['栏杆底部', '留空', '防坠物']
      },
      {
        id: 'red-line',
        clauseNo: '4.3',
        category: '红线与退距',
        title: '道路红线和用地红线内不得随意突出',
        appliesTo: '建筑主体、地下设施、阳台、雨篷、台阶、坡道、设备平台、围墙等附属设施。',
        requirement: '一般不应突出道路红线或用地红线建造；确需设置的城市公共设施、地铁相关设施等应按规划主管部门批准执行。',
        numericValues: ['地方规划条件'],
        keywords: ['道路红线', '用地红线', '退距', '规划条件'],
        note: '国标不规定统一退距米数，退距应按当地控规、规划条件或地方技术规定确定。'
      },
      {
        id: 'building-height-outdoor-ground',
        clauseNo: '3.1.3',
        category: '建筑高度',
        title: '建筑高度起算室外设计地坪',
        appliesTo: '民用建筑高度计算。',
        requirement: '建筑高度应按室外设计地坪至建筑主要屋面或檐口等控制点计算；坡屋面、多种屋面形式和局部突出物应按规范对应规则判断。',
        numericValues: ['室外设计地坪'],
        keywords: ['建筑高度', '室外设计地坪', '檐口', '屋面'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41795.htm'
      },
      {
        id: 'building-storey-basement',
        clauseNo: '3.1.4',
        category: '建筑层数',
        title: '地下室和半地下室层数判定',
        appliesTo: '民用建筑自然层数和消防高度判断。',
        requirement: '地下室、半地下室及顶板高出室外设计地面的空间是否计入层数，应结合顶板标高、室外地坪和规范定义判断。',
        numericValues: ['地下室', '半地下室'],
        keywords: ['建筑层数', '地下室', '半地下室', '顶板标高'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41795.htm'
      },
      {
        id: 'site-drainage',
        clauseNo: '4.1.5',
        category: '总平面',
        title: '基地排水不得污染周边',
        appliesTo: '建筑基地竖向、雨污水组织和场地排水。',
        requirement: '基地场地设计应组织排水，避免雨水、污水和地表径流对相邻用地、市政道路或公共空间造成不利影响。',
        numericValues: ['场地排水'],
        keywords: ['基地', '竖向', '排水', '雨水'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41797.htm'
      },
      {
        id: 'vehicle-pedestrian-flow',
        clauseNo: '4.2.3',
        category: '总平面',
        title: '人车流线与出入口组织',
        appliesTo: '基地机动车、非机动车和行人流线组织。',
        requirement: '基地出入口、车行道、人行道和停车场地应组织清晰，避免主要人流与车流交叉造成安全风险。',
        numericValues: ['人车分流'],
        keywords: ['出入口', '人车分流', '车行道', '停车'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41799.htm'
      },
      {
        id: 'stairs-ramp-hand-side',
        clauseNo: '5.1.7',
        category: '台阶坡道',
        title: '台阶和坡道两侧防护',
        appliesTo: '公共空间中存在高差的台阶、坡道。',
        requirement: '台阶、坡道两侧临空或存在跌落风险时，应设置栏杆、栏板或扶手等防护设施。',
        numericValues: ['临空防护'],
        keywords: ['台阶', '坡道', '栏杆', '扶手'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41804.htm'
      },
      {
        id: 'public-toilet-access',
        clauseNo: '5.2.8',
        category: '公共空间',
        title: '公共卫生间位置与服务可达',
        appliesTo: '公共建筑内公共卫生间。',
        requirement: '公共卫生间应布置在便于识别和到达的位置，并结合建筑类型、服务半径和人流组织设置。',
        numericValues: ['服务半径'],
        keywords: ['公共卫生间', '可达性', '服务半径'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41808.htm'
      },
      {
        id: 'corridor-clear-width',
        clauseNo: '5.3.2',
        category: '走廊',
        title: '走廊净宽满足通行与疏散',
        appliesTo: '民用建筑公共走廊和通道。',
        requirement: '公共走廊净宽应满足通行、搬运、无障碍和疏散要求；涉及人员密集或疏散时应与防火规范共同校核。',
        numericValues: ['疏散净宽'],
        keywords: ['走廊', '通道', '净宽', '疏散'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41805.htm'
      },
      {
        id: 'basement-safety',
        clauseNo: '5.6.1',
        category: '地下空间',
        title: '地下空间防水排水与安全',
        appliesTo: '地下室、半地下室和地下车库。',
        requirement: '地下空间应同步考虑防水、排水、通风、采光、疏散、消防和防涝措施，避免仅按面积效率布置。',
        numericValues: ['地下空间'],
        keywords: ['地下室', '地下车库', '防水', '排水', '疏散'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41811.htm'
      },
      {
        id: 'equipment-platform-protection',
        clauseNo: '6.5',
        category: '设备平台',
        title: '设备平台检修与防护',
        appliesTo: '室外设备平台、屋面设备平台和检修平台。',
        requirement: '设备平台应满足设备安装、检修、排水、防坠落和人员安全要求，临空部位应设置可靠防护。',
        numericValues: ['检修空间', '临空防护'],
        keywords: ['设备平台', '检修', '防护', '排水'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41810.htm'
      },
      {
        id: 'roof-access-protection',
        clauseNo: '6.6',
        category: '屋面',
        title: '上人屋面安全防护',
        appliesTo: '上人屋面、屋面设备检修区域和屋面活动空间。',
        requirement: '上人屋面应设置防坠落、防滑、排水和检修安全措施；临空栏杆应满足现行通用规范高度要求。',
        numericValues: ['1.10m'],
        keywords: ['上人屋面', '栏杆', '防坠落', '检修'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41813.htm'
      },
      {
        id: 'building-area-height',
        clauseNo: '3.1',
        category: '建筑面积',
        title: '结构层高2.20m与面积计算',
        appliesTo: '建筑面积计算与方案指标核对。',
        requirement: '建筑面积计算涉及结构层高2.20m分界值；方案指标阶段应同步核对层高、围护边界和地方测绘口径。',
        numericValues: ['2.20m'],
        keywords: ['建筑面积', '结构层高', '测绘', '指标'],
        note: '面积计算细节还会受到地方测绘规程影响。'
      }
    ]
  }),

  standard({
    id: 'gb55037-2022',
    title: '建筑防火通用规范',
    code: 'GB 55037-2022',
    status: '现行强制性工程建设规范',
    effectiveDate: '2023-06-01',
    category: '消防与安全',
    useCases: ['消防车道', '救援场地', '疏散宽度', '疏散净高', '高层住宅', '防火分隔'],
    keywords: ['防火', '消防车道', '疏散', '救援场地', '防火分隔', '防火门'],
    officialUrls: officialUrls('GB 55037-2022', [GB55037_CABR, 'http://www.jianbiaoku.com/webarbs/book/170895.shtml']),
    verifiedAt: VERIFIED_AT,
    note: '通用规范条文与旧《建筑设计防火规范》强制条文不一致时，原则上以现行通用规范为准；地方审查仍可能有补充口径。',
    sourceName: 'CABR规范库',
    sourceUrl: GB55037_CABR,
    clauses: [
      {
        id: 'fire-lane-width-height',
        clauseNo: '3.4.5',
        category: '消防车道',
        title: '消防车道净宽和净空',
        appliesTo: '消防车道或兼作消防车道的道路。',
        requirement: '消防车道净宽度和净空高度均不应小于4.00m。',
        numericValues: ['4.00m', '4m'],
        keywords: ['消防车道', '净宽', '净空', '4m'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41872.htm'
      },
      {
        id: 'fire-lane-slope',
        clauseNo: '3.4.5',
        category: '消防车道',
        title: '消防车道坡度',
        appliesTo: '消防车道及兼作消防车道的场地道路。',
        requirement: '消防车道坡度应满足满载消防车正常通行要求，且不应大于10%；兼作救援场地时还应满足消防车停靠和作业要求。',
        numericValues: ['10%'],
        keywords: ['消防车道', '坡度', '救援场地'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41872.htm'
      },
      {
        id: 'dead-end-fire-lane',
        clauseNo: '3.4.5',
        category: '消防车道',
        title: '尽头式消防车道回转',
        appliesTo: '尽头式消防车道。',
        requirement: '长度大于40m的尽头式消防车道应设置满足消防车回转要求的场地或道路。',
        numericValues: ['40m'],
        keywords: ['尽头式消防车道', '回车场', '回转'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41872.htm'
      },
      {
        id: 'fire-lane-obstacle',
        clauseNo: '3.4.5',
        category: '消防车道',
        title: '消防扑救面障碍控制',
        appliesTo: '消防车道与建筑消防扑救面之间。',
        requirement: '消防车道与建筑消防扑救面之间不应设置妨碍消防车操作的障碍物，也不应有影响安全作业的架空高压电线。',
        numericValues: ['不得设置障碍物'],
        keywords: ['扑救面', '障碍物', '架空线'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41872.htm'
      },
      {
        id: 'high-rise-rescue-side',
        clauseNo: '3.4.6',
        category: '消防救援',
        title: '高层建筑登高操作场地',
        appliesTo: '高层建筑。',
        requirement: '高层建筑应至少沿一条长边设置消防车登高操作场地；分段布置时，救援作业范围应覆盖全部消防扑救面。',
        numericValues: ['一条长边'],
        keywords: ['高层建筑', '登高操作场地', '扑救面'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41872.htm'
      },
      {
        id: 'rescue-site-skirt',
        clauseNo: '3.4.7',
        category: '消防救援',
        title: '登高场地与建筑之间的裙房进深',
        appliesTo: '消防车登高操作场地与建筑之间。',
        requirement: '场地与建筑之间不应有进深大于4m的裙房或其他妨碍消防车操作的障碍物。',
        numericValues: ['4m'],
        keywords: ['登高场地', '裙房', '进深'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41872.htm'
      },
      {
        id: 'egress-door-width',
        clauseNo: '7.1.4',
        category: '疏散',
        title: '疏散出口门最小净宽',
        appliesTo: '疏散出口门、室外疏散楼梯。',
        requirement: '疏散出口门和室外疏散楼梯净宽度均不应小于0.80m。',
        numericValues: ['0.80m'],
        keywords: ['疏散门', '安全出口', '室外楼梯', '净宽'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41891.htm'
      },
      {
        id: 'residential-egress-door',
        clauseNo: '7.1.4',
        category: '疏散',
        title: '住宅户门最小净宽',
        appliesTo: '住宅建筑中直通室外地面的住宅户门。',
        requirement: '直通室外地面的住宅户门净宽度不应小于0.80m。',
        numericValues: ['0.80m'],
        keywords: ['住宅户门', '疏散门', '净宽'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41893.htm'
      },
      {
        id: 'residential-stair-width-low',
        clauseNo: '7.1.4',
        category: '疏散',
        title: '低层住宅一侧栏杆楼梯宽度',
        appliesTo: '建筑高度不大于18m，且一边设置栏杆的住宅室内疏散楼梯。',
        requirement: '室内疏散楼梯净宽度不应小于1.00m。',
        numericValues: ['18m', '1.00m'],
        keywords: ['住宅楼梯', '疏散楼梯', '净宽'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41893.htm'
      },
      {
        id: 'residential-stair-width',
        clauseNo: '7.1.4',
        category: '疏散',
        title: '一般住宅室内疏散楼梯宽度',
        appliesTo: '不属于低层一侧栏杆放宽情形的住宅建筑室内疏散楼梯。',
        requirement: '室内疏散楼梯净宽度不应小于1.10m。',
        numericValues: ['1.10m'],
        keywords: ['住宅楼梯', '疏散楼梯', '净宽'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41893.htm'
      },
      {
        id: 'egress-clear-height',
        clauseNo: '7.1.5',
        category: '疏散',
        title: '疏散通道、走道、出口净高',
        appliesTo: '疏散通道、疏散走道、疏散出口。',
        requirement: '疏散通道、疏散走道、疏散出口净高度均不应小于2.10m，并应设置明显疏散指示标志。',
        numericValues: ['2.10m'],
        keywords: ['疏散净高', '疏散走道', '疏散出口'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41891.htm'
      },
      {
        id: 'residential-stair-type-21',
        clauseNo: '7.3.2',
        category: '住宅消防',
        title: '21m以下住宅楼梯间条件',
        appliesTo: '建筑高度不大于21m的住宅建筑。',
        requirement: '当户门耐火完整性低于1.00h且疏散楼梯与电梯井相邻布置时，疏散楼梯应为封闭楼梯间。',
        numericValues: ['21m', '1.00h'],
        keywords: ['住宅', '封闭楼梯间', '耐火完整性'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41893.htm'
      },
      {
        id: 'residential-stair-type-33',
        clauseNo: '7.3.2',
        category: '住宅消防',
        title: '21m至33m住宅楼梯间',
        appliesTo: '建筑高度大于21m且不大于33m的住宅建筑。',
        requirement: '当户门耐火完整性低于1.00h时，疏散楼梯应为封闭楼梯间。',
        numericValues: ['21m', '33m', '1.00h'],
        keywords: ['住宅', '封闭楼梯间', '耐火完整性'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41893.htm'
      },
      {
        id: 'residential-stair-type-over33',
        clauseNo: '7.3.2',
        category: '住宅消防',
        title: '33m以上住宅防烟楼梯间',
        appliesTo: '建筑高度大于33m的住宅建筑。',
        requirement: '疏散楼梯应为防烟楼梯间，开向前室或合用前室的户门应为耐火性能不低于乙级的防火门。',
        numericValues: ['33m', '乙级防火门'],
        keywords: ['住宅', '防烟楼梯间', '乙级防火门'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41893.htm'
      },
      {
        id: 'one-stair-unit',
        clauseNo: '7.3.2',
        category: '住宅消防',
        title: '一部疏散楼梯住宅高度限制',
        appliesTo: '每层仅设置1部疏散楼梯的住宅单元。',
        requirement: '建筑高度大于27m且不大于54m、每层仅设1部疏散楼梯的住宅单元，应满足规范限定条件。',
        numericValues: ['27m', '54m', '1部楼梯'],
        keywords: ['住宅', '一部楼梯', '高度'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41893.htm'
      },
      {
        id: 'fire-wall-material',
        clauseNo: '6.1.1',
        category: '防火分隔',
        title: '防火墙材料和耐火极限',
        appliesTo: '防火墙。',
        requirement: '防火墙应直接设置在建筑基础、框架梁等承重结构上，并采用不燃性墙体，耐火极限不应低于3.00h。',
        numericValues: ['3.00h'],
        keywords: ['防火墙', '耐火极限', '不燃性'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41884.htm'
      },
      {
        id: 'fire-wall-roof',
        clauseNo: '6.1.2',
        category: '防火分隔',
        title: '防火墙高出屋面',
        appliesTo: '防火墙两侧屋面为可燃或难燃构件的情况。',
        requirement: '当防火墙两侧屋面板为可燃或难燃材料时，防火墙应高出屋面不小于0.50m。',
        numericValues: ['0.50m'],
        keywords: ['防火墙', '屋面', '高出屋面'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41884.htm'
      },
      {
        id: 'fire-wall-eaves',
        clauseNo: '6.1.2',
        category: '防火分隔',
        title: '防火墙凸出可燃墙体',
        appliesTo: '防火墙两侧外墙为可燃或难燃墙体的情况。',
        requirement: '防火墙应凸出墙外表面不小于0.40m，或采取防止火势沿外墙蔓延的等效措施。',
        numericValues: ['0.40m'],
        keywords: ['防火墙', '外墙', '火势蔓延'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41884.htm'
      },
      {
        id: 'fire-wall-openings',
        clauseNo: '6.1.5',
        category: '防火分隔',
        title: '防火墙两侧门窗洞口水平距离',
        appliesTo: '防火墙两侧相邻门窗洞口。',
        requirement: '防火墙两侧门窗洞口最近边缘水平距离不应小于2.00m；采用乙级防火窗等措施时可按规范条件处理。',
        numericValues: ['2.00m', '乙级防火窗'],
        keywords: ['防火墙', '门窗洞口', '防火窗'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41884.htm'
      },
      {
        id: 'pipe-shaft-separation',
        clauseNo: '6.3.1',
        category: '竖向井道',
        title: '电缆井管道井防火分隔',
        appliesTo: '电缆井、管道井、排烟道、排气道等竖向井道。',
        requirement: '竖向井道应独立设置并采用耐火极限满足规范要求的井壁与周围空间分隔，井壁上的检查门应采用防火门。',
        numericValues: ['防火门'],
        keywords: ['电缆井', '管道井', '竖井', '防火门'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41886.htm'
      },
      {
        id: 'pipe-shaft-floor-seal',
        clauseNo: '6.3.2',
        category: '竖向井道',
        title: '竖井楼板处防火封堵',
        appliesTo: '电缆井、管道井穿越楼板部位。',
        requirement: '井道在每层楼板处应采用不燃材料或防火封堵材料封堵，防止烟火沿竖井蔓延。',
        numericValues: ['逐层封堵'],
        keywords: ['竖井', '楼板', '防火封堵', '管线']
      },
      {
        id: 'equipment-room-fire-door',
        clauseNo: '6.4',
        category: '设备用房',
        title: '设备用房防火分隔和防火门',
        appliesTo: '消防水泵房、变配电室、柴油发电机房、锅炉房等设备用房。',
        requirement: '设备用房应与其他部位进行防火分隔，开向建筑内的门应采用防火门；有爆炸危险或油气设备时还应按专项要求处理。',
        numericValues: ['防火门'],
        keywords: ['设备用房', '消防水泵房', '变配电室', '防火分隔'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41876.htm'
      },
      {
        id: 'evacuation-path-separation',
        clauseNo: '7.1.2',
        category: '疏散',
        title: '疏散路径与其他功能分隔',
        appliesTo: '疏散走道、楼梯间、前室和疏散出口。',
        requirement: '疏散路径应保持连续、安全和可识别，不应被经营、储藏、设备等非疏散功能占用或切断。',
        numericValues: ['连续疏散'],
        keywords: ['疏散路径', '疏散走道', '前室'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41892.htm'
      },
      {
        id: 'public-egress-number',
        clauseNo: '7.4.1',
        category: '公共建筑疏散',
        title: '公共建筑安全出口数量',
        appliesTo: '公共建筑每个防火分区或每个楼层。',
        requirement: '公共建筑每个防火分区或每个楼层的安全出口数量应满足人员疏散要求，通常不应少于2个；允许设置1个时必须符合规范限定条件。',
        numericValues: ['2个'],
        keywords: ['公共建筑', '安全出口', '防火分区'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41894.htm'
      },
      {
        id: 'public-stair-independent',
        clauseNo: '7.4.4',
        category: '公共建筑疏散',
        title: '疏散楼梯间独立性',
        appliesTo: '公共建筑疏散楼梯间。',
        requirement: '疏散楼梯间应能直通室外或通过安全区域通向室外，并避免与非疏散空间相互穿套。',
        numericValues: ['直通室外'],
        keywords: ['疏散楼梯间', '室外', '安全区域'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41894.htm'
      },
      {
        id: 'underground-egress',
        clauseNo: '7.4',
        category: '公共建筑疏散',
        title: '地下公共空间疏散',
        appliesTo: '地下或半地下公共建筑、地下商业、地下车库附属公共空间。',
        requirement: '地下空间疏散应特别核对安全出口数量、疏散楼梯形式、防烟前室和直通室外路径，避免只按地上建筑习惯布置。',
        numericValues: ['地下空间'],
        keywords: ['地下空间', '安全出口', '防烟前室'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41894.htm'
      },
      {
        id: 'atrium-fire-separation',
        clauseNo: '5.3',
        category: '防火分隔',
        title: '中庭与周围空间防火分隔',
        appliesTo: '建筑内中庭、共享大厅等上下连通空间。',
        requirement: '中庭与周围连通空间应按规范采取防火分隔、防烟排烟和疏散组织措施，避免火烟跨层蔓延。',
        numericValues: ['中庭防火分隔'],
        keywords: ['中庭', '防火分隔', '排烟', '跨层'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41876.htm'
      },
      {
        id: 'commercial-fire-partition',
        clauseNo: '5.3',
        category: '防火分区',
        title: '商业营业厅防火分区',
        appliesTo: '商店、营业厅、展厅等大开间公共空间。',
        requirement: '大空间商业和展厅应结合楼层位置、自动灭火系统、排烟条件和疏散距离确定防火分区面积，不应仅按业态完整性划分。',
        numericValues: ['防火分区面积'],
        keywords: ['商业', '营业厅', '防火分区', '疏散距离'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41876.htm'
      },
      {
        id: 'garage-fire-compartment',
        clauseNo: '5.3',
        category: '防火分区',
        title: '车库防火分区与疏散',
        appliesTo: '汽车库、自行车库及地下停车空间。',
        requirement: '车库防火分区应与停车组织、排烟、喷淋、疏散楼梯和车道防火分隔协同，避免把车行联系误作为人员安全疏散。',
        numericValues: ['防火分区'],
        keywords: ['车库', '防火分区', '排烟', '疏散'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-41876.htm'
      }
    ]
  }),

  standard({
    id: 'gb55038-2025',
    title: '住宅项目规范',
    code: 'GB 55038-2025',
    status: '现行强制性工程建设规范',
    effectiveDate: '2025-05-01',
    category: '住宅',
    useCases: ['住宅套型', '住宅净高', '住宅电梯', '阳台栏杆', '日照采光', '住宅公区'],
    keywords: ['住宅', '卧室', '厨房', '卫生间', '电梯', '栏杆', '日照', '通风', '配电箱'],
    officialUrls: officialUrls('GB 55038-2025', [GB55038_CABR, GB55038_MOHURD_ARTICLE]),
    verifiedAt: VERIFIED_AT,
    note: '2025年5月1日起实施的住宅项目强制性工程建设规范；旧住宅规范中的相关强制条文与本规范不一致时，以本规范为准。',
    sourceName: 'CABR规范库',
    sourceUrl: GB55038_CABR,
    clauses: [
      {
        id: 'site-green-space',
        clauseNo: '3.2.2',
        category: '住宅场地',
        title: '居住街坊集中绿地',
        appliesTo: '住宅项目居住街坊集中绿地配置。',
        requirement: '新区建设项目人均集中绿地面积不应小于0.50㎡，旧区改建项目不应小于0.35㎡；集中绿地宽度不应小于8m，日照阴影线范围外的绿地面积占比不应小于1/3，并应设置老年人和儿童活动场地。',
        numericValues: ['0.50㎡/人', '0.35㎡/人', '8m', '1/3'],
        keywords: ['集中绿地', '居住街坊', '儿童活动场地', '老年人活动场地'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70093.htm'
      },
      {
        id: 'site-terrace-slope',
        clauseNo: '3.2.4',
        category: '住宅场地',
        title: '自然坡度较大场地台地式布局',
        appliesTo: '住宅项目场地自然坡度大于8.0%的山地或坡地项目。',
        requirement: '场地自然坡度大于8.0%时应采用台地式布局；高度大于2.0m的护坡或挡土墙上缘与高台地建筑水平净距不应小于3.0m，下缘与低台地建筑水平净距不应小于2.0m。',
        numericValues: ['8.0%', '2.0m', '3.0m', '2.0m'],
        keywords: ['台地', '挡土墙', '护坡', '山地住宅'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70093.htm'
      },
      {
        id: 'site-drainage-slope',
        clauseNo: '3.2.5',
        category: '住宅场地',
        title: '住宅场地排水坡度',
        appliesTo: '住宅项目室外场地竖向与雨水径流组织。',
        requirement: '场地竖向设计应满足防洪排涝和雨水资源化利用要求，场地地面排水设计坡度不应小于0.2%。',
        numericValues: ['0.2%'],
        keywords: ['场地排水', '竖向', '雨水', '防洪排涝'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70093.htm'
      },
      {
        id: 'bedroom-area',
        clauseNo: '4.1.1',
        category: '套内空间',
        title: '卧室最小使用面积与短边',
        appliesTo: '新建住宅套内卧室和兼起居室的卧室。',
        requirement: '卧室使用面积不应小于5㎡，兼起居室的卧室使用面积不应小于9㎡，卧室短边净宽不应小于1.80m。',
        numericValues: ['5㎡', '9㎡', '1.80m'],
        keywords: ['卧室面积', '短边净宽', '套型'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70096.htm'
      },
      {
        id: 'new-residential-height',
        clauseNo: '4.1.2',
        category: '住宅净高',
        title: '新建住宅层高与主要房间净高',
        appliesTo: '新建住宅建筑层高、卧室和起居室净高。',
        requirement: '新建住宅层高不应低于3.00m；卧室、起居室室内净高不应低于2.60m，局部净高不应低于2.20m，且低于2.60m的局部净高面积不应大于室内使用面积的1/3。',
        numericValues: ['3.00m', '2.60m', '2.20m', '1/3'],
        keywords: ['住宅层高', '卧室净高', '起居室净高', '局部净高'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70096.htm'
      },
      {
        id: 'slope-roof-height-2025',
        clauseNo: '4.1.2',
        category: '住宅净高',
        title: '坡屋顶内卧室与起居室净高',
        appliesTo: '利用坡屋顶内空间作为卧室或起居室。',
        requirement: '坡屋顶内卧室、起居室中，室内净高不低于2.20m的使用面积不应小于室内使用面积的1/2。',
        numericValues: ['2.20m', '1/2'],
        keywords: ['坡屋顶', '净高', '卧室', '起居室'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70096.htm'
      },
      {
        id: 'kitchen-toilet-height-2025',
        clauseNo: '4.1.2',
        category: '住宅净高',
        title: '厨房和卫生间室内净高',
        appliesTo: '新建住宅厨房、卫生间。',
        requirement: '厨房、卫生间的室内净高不应低于2.20m。',
        numericValues: ['2.20m'],
        keywords: ['厨房净高', '卫生间净高', '住宅净高'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70096.htm'
      },
      {
        id: 'basement-room-ban',
        clauseNo: '4.1.3',
        category: '套内空间',
        title: '卧室起居室厨房不得布置在地下室',
        appliesTo: '住宅卧室、起居室和厨房空间布置。',
        requirement: '卧室、起居室和厨房不应布置在地下室；布置在半地下室时，应采取通风、防潮、排水和安全防护等措施。',
        numericValues: ['不得布置地下室'],
        keywords: ['地下室', '半地下室', '卧室', '厨房'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70096.htm'
      },
      {
        id: 'kitchen-area',
        clauseNo: '4.1.4',
        category: '厨房',
        title: '厨房最小使用面积',
        appliesTo: '住宅套内厨房。',
        requirement: '厨房使用面积不应小于3.5㎡，并应配置洗涤池、水龙头、案台、灶具、排油烟机等设施或预留安装位置。',
        numericValues: ['3.5㎡'],
        keywords: ['厨房面积', '洗涤池', '灶具', '排油烟机'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70096.htm'
      },
      {
        id: 'toilet-fixtures-area',
        clauseNo: '4.1.6',
        category: '卫生间',
        title: '卫生间三件套与最小面积',
        appliesTo: '住宅套内卫生间。',
        requirement: '每套住宅卫生间应至少配置便器、洗浴器、洗面器三件卫生器具或预留条件；三件集中配置的卫生间使用面积不应小于2.5㎡，布置便器的卫生间门不应直接开在厨房内。',
        numericValues: ['2.5㎡', '三件卫生器具'],
        keywords: ['卫生间面积', '便器', '洗浴器', '洗面器'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70096.htm'
      },
      {
        id: 'toilet-over-other-unit',
        clauseNo: '4.1.7',
        category: '卫生间',
        title: '卫生间不得压其他住户主要房间',
        appliesTo: '住宅上下层套型关系。',
        requirement: '卫生间不应直接布置在其他住户卧室、起居室、厨房或餐厅的上层。',
        numericValues: ['不得压下层主要房间'],
        keywords: ['卫生间', '下层住户', '卧室', '厨房', '餐厅'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70096.htm'
      },
      {
        id: 'toilet-multilevel',
        clauseNo: '4.1.8',
        category: '卫生间',
        title: '多层套型卫生间配置',
        appliesTo: '跃层、复式等多层住宅套型。',
        requirement: '多层套型中，布置有起居室或卧室的楼层至少应设1间带便器和洗面器的卫生间或预留安装位置，并为扶手、外开门或推拉门改造预留条件。',
        numericValues: ['每层至少1间'],
        keywords: ['跃层', '复式', '扶手', '卫生间门'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70096.htm'
      },
      {
        id: 'toilet-waterproof-slope',
        clauseNo: '4.1.9',
        category: '卫生间防水',
        title: '卫生间排水坡与防水高度',
        appliesTo: '住宅卫生间地面、淋浴区、洗面器处和其他墙面。',
        requirement: '卫生间地面排水坡度不应小于1%；淋浴区墙面防水层高度不应小于2.00m且不低于喷淋口；洗面器处墙面防水高度不应小于1.20m；其他墙面泛水翻起高度不应小于0.25m。',
        numericValues: ['1%', '2.00m', '1.20m', '0.25m'],
        keywords: ['卫生间防水', '排水坡', '淋浴区', '泛水'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70096.htm'
      },
      {
        id: 'toilet-slip',
        clauseNo: '4.1.10',
        category: '防滑',
        title: '卫生间防滑系数',
        appliesTo: '住宅卫生间地面铺装。',
        requirement: '卫生间地面应采用防滑铺装，地面静摩擦系数COF不应小于0.6。',
        numericValues: ['COF≥0.6'],
        keywords: ['卫生间', '防滑', '静摩擦系数', 'COF'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70096.htm'
      },
      {
        id: 'wet-area-height-difference',
        clauseNo: '4.1.12',
        category: '无障碍改造',
        title: '厨房卫生间封闭阳台地面高差',
        appliesTo: '厨房、卫生间、封闭阳台、户门门槛及户门内外高差。',
        requirement: '厨房、卫生间、封闭阳台与相邻空间地面高差不应大于0.015m，并应以斜坡过渡；户门门槛高度和户门内外高差均不应大于0.015m。',
        numericValues: ['0.015m', '15mm'],
        keywords: ['地面高差', '门槛', '斜坡过渡', '无障碍改造'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70096.htm'
      },
      {
        id: 'in-unit-corridor-width',
        clauseNo: '4.1.13',
        category: '套内通道',
        title: '套内过道净宽',
        appliesTo: '住宅套内入口过道、通往卧室和起居室的过道、通往厨房和卫生间等辅助空间的过道。',
        requirement: '套内入口过道净宽不应小于1.10m；通往卧室、起居室的过道净宽不应小于1.00m；通往厨房、卫生间、贮藏室的过道净宽不应小于0.90m。',
        numericValues: ['1.10m', '1.00m', '0.90m'],
        keywords: ['过道净宽', '套内通道', '入口过道'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70096.htm'
      },
      {
        id: 'unit-door-width',
        clauseNo: '4.1.14',
        category: '门净宽',
        title: '住宅户门与房间门通行净宽',
        appliesTo: '新建住宅、既有住宅改造、卧室门、厨房门和卫生间门。',
        requirement: '新建住宅户门通行净宽不应小于0.90m；既有住宅改造户门不应小于0.80m；卧室门不应小于0.80m；厨房门和卫生间门不应小于0.70m，并应预留无障碍改造条件。',
        numericValues: ['0.90m', '0.80m', '0.70m'],
        keywords: ['户门', '卧室门', '厨房门', '卫生间门', '无障碍改造'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70096.htm'
      },
      {
        id: 'balcony-guardrail-2025',
        clauseNo: '4.1.15',
        category: '阳台栏杆',
        title: '住宅阳台栏杆高度与净距',
        appliesTo: '设有阳台的住宅。',
        requirement: '阳台栏杆净高不应低于1.20m，竖向杆件间净距不应大于0.11m，并应采取防攀登和防止物品、花盆坠落的措施。',
        numericValues: ['1.20m', '0.11m'],
        keywords: ['阳台栏杆', '防攀登', '花盆坠落', '栏杆净距'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70096.htm'
      },
      {
        id: 'low-window-protection-2025',
        clauseNo: '4.1.16',
        category: '外窗防护',
        title: '临空外窗与凸窗防护',
        appliesTo: '窗台距室内地面较低的临空外窗和凸窗。',
        requirement: '临空外窗窗台距室内地面净高小于0.90m时应设防护；凸窗窗台高度小于或等于0.45m时，防护高度从窗台面起算不应小于0.90m；凸窗窗台高度大于0.45m时，防护高度从窗台面起算不应小于0.60m。',
        numericValues: ['0.90m', '0.45m', '0.60m'],
        keywords: ['低窗台', '凸窗', '外窗防护'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70096.htm'
      },
      {
        id: 'narrow-recess-window',
        clauseNo: '4.1.17',
        category: '采光通风',
        title: '狭窄凹口内不得设卧室起居室外窗',
        appliesTo: '住宅凹口内卧室、起居室外窗布置。',
        requirement: '住宅建筑凹口净宽与净深之比小于1:3且净宽小于1.20m时，卧室和起居室外窗不应设置在凹口内。',
        numericValues: ['1:3', '1.20m'],
        keywords: ['凹口', '外窗', '卧室', '起居室'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70096.htm'
      },
      {
        id: 'public-corridor-2025',
        clauseNo: '4.2.1',
        category: '住宅公区',
        title: '住宅公共走廊净宽与净高',
        appliesTo: '设有公共走廊的住宅。',
        requirement: '公共走廊净宽不应小于1.20m，净高不应低于2.20m；设置封闭外廊时应设可开启窗扇。',
        numericValues: ['1.20m', '2.20m'],
        keywords: ['公共走廊', '外廊', '净宽', '净高'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70097.htm'
      },
      {
        id: 'public-stair-width-2025',
        clauseNo: '4.2.2',
        category: '住宅楼梯',
        title: '住宅公共楼梯梯段净宽',
        appliesTo: '住宅公共楼梯。',
        requirement: '最高入户层距室外设计地面不超过15m时，一侧栏杆梯段净宽不应小于1.00m，两侧为墙体时不应小于1.10m；超过15m时梯段净宽不应小于1.10m。',
        numericValues: ['15m', '1.00m', '1.10m'],
        keywords: ['公共楼梯', '梯段净宽', '住宅楼梯'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70097.htm'
      },
      {
        id: 'public-stair-step-2025',
        clauseNo: '4.2.2',
        category: '住宅楼梯',
        title: '住宅公共楼梯踏步尺寸',
        appliesTo: '住宅公共楼梯踏步。',
        requirement: '公共楼梯踏步宽度不应小于0.26m，踏步高度不应大于0.175m，同一梯段踏步宽度和高度应一致，首步和末步应有明显标志。',
        numericValues: ['0.26m', '0.175m'],
        keywords: ['踏步宽度', '踏步高度', '首末步标志'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70097.htm'
      },
      {
        id: 'public-stair-guardrail-2025',
        clauseNo: '4.2.2',
        category: '住宅楼梯',
        title: '住宅楼梯扶手和楼梯井防护',
        appliesTo: '住宅公共楼梯扶手、水平段栏杆和楼梯井。',
        requirement: '楼梯扶手高度不应小于0.90m；水平段栏杆长度大于0.50m时扶手高度不应小于1.20m；竖向杆件净距不应大于0.11m；楼梯井净宽大于0.11m时应采取防坠落和防攀登措施。',
        numericValues: ['0.90m', '0.50m', '1.20m', '0.11m'],
        keywords: ['扶手高度', '楼梯井', '栏杆净距', '防坠落'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70097.htm'
      },
      {
        id: 'equipment-noise-room',
        clauseNo: '4.2.3',
        category: '噪声控制',
        title: '电梯井道和设备机房不得紧邻卧室',
        appliesTo: '住宅电梯井道、电梯机房、水泵机房等噪声或振动房间。',
        requirement: '电梯井道、电梯机房、水泵机房等产生噪声或振动的房间不应紧邻卧室布置。',
        numericValues: ['不应紧邻卧室'],
        keywords: ['电梯井', '水泵机房', '卧室', '噪声'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70097.htm'
      },
      {
        id: 'elevator-count-2025',
        clauseNo: '4.2.4',
        category: '住宅电梯',
        title: '新建住宅电梯设置数量',
        appliesTo: '新建住宅单元电梯设置。',
        requirement: '最高入户层为四层及以上，或最高入户层楼面距室外设计地面高度超过9m时，每个住宅单元至少设置1台电梯；十二层及以上，或高度超过33m时，每个单元至少设置2台电梯。',
        numericValues: ['4层', '9m', '12层', '33m', '1台', '2台'],
        keywords: ['住宅电梯', '四层', '十二层', '最高入户层'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70097.htm'
      },
      {
        id: 'elevator-size-2025',
        clauseNo: '4.2.4',
        category: '住宅电梯',
        title: '住宅电梯轿厢门和轿厢尺寸',
        appliesTo: '设有电梯的住宅单元。',
        requirement: '设有电梯的住宅单元至少1台电梯轿厢门净宽不应小于0.90m；宽轿厢长边不应小于1.60m、短边不应小于1.50m；深轿厢宽度不应小于1.10m、深度不应小于2.10m。',
        numericValues: ['0.90m', '1.60m', '1.50m', '1.10m', '2.10m'],
        keywords: ['电梯轿厢', '门净宽', '宽轿厢', '深轿厢'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70097.htm'
      },
      {
        id: 'elevator-call-button-2025',
        clauseNo: '4.2.4',
        category: '住宅电梯',
        title: '住宅电梯紧急呼叫按钮高度',
        appliesTo: '住宅电梯紧急呼叫按钮。',
        requirement: '电梯紧急呼叫按钮中心距地面高度应为0.85m至1.10m。',
        numericValues: ['0.85m', '1.10m'],
        keywords: ['电梯按钮', '紧急呼叫', '按钮高度'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70097.htm'
      },
      {
        id: 'existing-elevator-addition',
        clauseNo: '4.2.5',
        category: '住宅电梯',
        title: '既有住宅加装电梯基本尺寸',
        appliesTo: '既有住宅建筑加装电梯。',
        requirement: '既有住宅加装电梯不应影响结构安全和正常使用功能；加装电梯载重量不应小于320kg，轿厢门净宽不应小于0.80m。',
        numericValues: ['320kg', '0.80m'],
        keywords: ['加装电梯', '既有住宅', '轿厢门'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70097.htm'
      },
      {
        id: 'public-entrance-2025',
        clauseNo: '4.2.7',
        category: '住宅公区',
        title: '住宅公共出入口无障碍与门净宽',
        appliesTo: '住宅单元公共出入口。',
        requirement: '每个住宅单元至少应有1个无障碍公共出入口；外门通行净宽不应小于1.10m，双扇门至少1扇通行净宽不应小于0.80m，非平坡出入口平台净深不应小于1.50m。',
        numericValues: ['1个', '1.10m', '0.80m', '1.50m'],
        keywords: ['公共出入口', '无障碍', '外门净宽', '平台净深'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70097.htm'
      },
      {
        id: 'entrance-canopy-steps',
        clauseNo: '4.2.7',
        category: '住宅公区',
        title: '公共出入口雨篷与台阶防护',
        appliesTo: '住宅公共出入口上方雨篷和临空台阶。',
        requirement: '公共出入口上方雨篷宽度不应小于门洞宽度，挑出长度应超过门扇开启最远点且不应小于1.00m；台阶总高度超过0.70m且侧面临空时，应设净高不低于1.20m的防护设施。',
        numericValues: ['1.00m', '0.70m', '1.20m'],
        keywords: ['雨篷', '台阶', '防护设施', '出入口'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70097.htm'
      },
      {
        id: 'public-guardrail-2025',
        clauseNo: '4.2.8',
        category: '住宅公区',
        title: '住宅公共临空处栏杆',
        appliesTo: '外廊、室内回廊、内天井、室外楼梯、上人屋面等临空处。',
        requirement: '临空处应设防护栏杆，栏杆净高不应低于1.20m；栏杆应防攀登、防物品坠落，竖向杆件净距不应大于0.11m。',
        numericValues: ['1.20m', '0.11m'],
        keywords: ['外廊', '上人屋面', '栏杆', '防攀登'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70097.htm'
      },
      {
        id: 'public-floor-slip',
        clauseNo: '4.2.9',
        category: '防滑',
        title: '住宅公区地面防滑',
        appliesTo: '公共出入口内外、公共走廊、公共楼梯、电梯厅等住宅公区地面。',
        requirement: '公共出入口、公共走廊、公共楼梯、电梯厅等地面应采用防滑铺装，地面静摩擦系数COF不应小于0.6。',
        numericValues: ['COF≥0.6'],
        keywords: ['公共走廊', '公共楼梯', '电梯厅', '防滑'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70097.htm'
      },
      {
        id: 'shaft-fire-seal-2025',
        clauseNo: '4.2.11',
        category: '竖向井道',
        title: '住宅电缆井和管道井逐层封堵',
        appliesTo: '住宅建筑电缆井、管道井。',
        requirement: '电缆井、管道井应在每层楼板处严密封堵。',
        numericValues: ['每层封堵'],
        keywords: ['电缆井', '管道井', '封堵', '楼板'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70097.htm'
      },
      {
        id: 'ac-outdoor-unit',
        clauseNo: '4.2.12',
        category: '设备平台',
        title: '分体空调室外机位',
        appliesTo: '采用分体式空调的住宅建筑室外机位置和安装。',
        requirement: '室外机位应设置方便安装维护的可上人专用平台板或预留空间，保障通风散热，采用坐式安装并与平台板或支架连接牢固，采取防坠落措施。',
        numericValues: ['可上人平台', '坐式安装'],
        keywords: ['空调室外机', '设备平台', '防坠落', '散热'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70097.htm'
      },
      {
        id: 'solar-pv-system',
        clauseNo: '4.2.13',
        category: '绿色与节能',
        title: '太阳能热水和光伏系统同步设计',
        appliesTo: '新建住宅采用太阳能热水系统或光伏系统。',
        requirement: '太阳能热水系统、光伏系统应统一规划、同步设计、同步施工，与主体结构连接牢固，并采取防水、密封和排水构造措施。',
        numericValues: ['同步设计', '同步施工'],
        keywords: ['太阳能热水', '光伏', '防水', '主体结构'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70097.htm'
      },
      {
        id: 'solid-slab-thickness',
        clauseNo: '5.0.4',
        category: '结构安全',
        title: '钢筋混凝土实心楼板厚度',
        appliesTo: '新建住宅钢筋混凝土结构实心楼板。',
        requirement: '新建住宅建筑钢筋混凝土结构实心楼板厚度不应小于100mm。',
        numericValues: ['100mm'],
        keywords: ['楼板厚度', '钢筋混凝土', '住宅结构'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70098.htm'
      },
      {
        id: 'bedroom-sound-insulation',
        clauseNo: '6.1.2',
        category: '声环境',
        title: '住宅分户墙和楼板空气声隔声',
        appliesTo: '住宅卧室、起居室与相邻房间之间墙、楼板。',
        requirement: '卧室分户墙和分户楼板两侧房间之间空气声隔声指标不应小于50dB，其他分户墙和分户楼板不应小于48dB；卧室、起居室楼板撞击声压级不应大于65dB。',
        numericValues: ['50dB', '48dB', '65dB'],
        keywords: ['分户墙', '分户楼板', '隔声', '撞击声'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70100.htm'
      },
      {
        id: 'exterior-sound-insulation',
        clauseNo: '6.1.3',
        category: '声环境',
        title: '住宅外墙和外门窗隔声',
        appliesTo: '住宅外墙、外门窗，尤其是临交通干线侧卧室外门窗。',
        requirement: '住宅外墙隔声指标不应小于45dB；临交通干线侧卧室外门窗不应小于35dB；其他外门窗不应小于30dB。',
        numericValues: ['45dB', '35dB', '30dB'],
        keywords: ['外墙隔声', '外门窗', '交通干线', '卧室'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70100.htm'
      },
      {
        id: 'drain-noise',
        clauseNo: '6.1.4',
        category: '声环境',
        title: '卫生间排水立管与卧室噪声',
        appliesTo: '与卧室相邻的卫生间和排水立管。',
        requirement: '与卧室相邻的卫生间排水立管不应贴邻卧室共用墙体，并应隔声包覆；上层卫生间排水时卧室内排水噪声等效声级不应大于33dB。',
        numericValues: ['33dB'],
        keywords: ['排水立管', '卧室', '排水噪声', '隔声包覆'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70100.htm'
      },
      {
        id: 'residential-sunlight',
        clauseNo: '6.2.1',
        category: '日照采光',
        title: '每套住宅至少一个居室满足日照',
        appliesTo: '住宅套型日照分析。',
        requirement: '每套住宅应至少有一个卧室或起居室能满足日照标准。',
        numericValues: ['至少1个房间'],
        keywords: ['日照', '卧室', '起居室', '住宅间距'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70101.htm'
      },
      {
        id: 'direct-daylighting',
        clauseNo: '6.2.2',
        category: '日照采光',
        title: '卧室起居室厨房直接采光',
        appliesTo: '住宅卧室、起居室、厨房。',
        requirement: '每套住宅的卧室、起居室、厨房均应有直接采光。',
        numericValues: ['直接采光'],
        keywords: ['采光', '卧室', '起居室', '厨房'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70101.htm'
      },
      {
        id: 'natural-ventilation',
        clauseNo: '6.3.3',
        category: '自然通风',
        title: '住宅自然通风开口面积',
        appliesTo: '住宅套内卧室、起居室、厨房及设阳台的房间。',
        requirement: '每套住宅自然通风开口面积不应小于地面面积的5%；卧室、起居室直接自然通风开口面积不应小于该房间地面面积的5%；厨房不应小于10%且不应小于0.60㎡。',
        numericValues: ['5%', '10%', '0.60㎡'],
        keywords: ['自然通风', '通风开口', '厨房通风', '阳台'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70102.htm'
      },
      {
        id: 'water-pressure',
        clauseNo: '7.1.2',
        category: '给水排水',
        title: '套内分户用水点压力',
        appliesTo: '住宅套内分户用水点。',
        requirement: '住宅套内分户用水点给水压力不应小于0.1MPa。',
        numericValues: ['0.1MPa'],
        keywords: ['给水压力', '分户用水点', '生活给水'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70104.htm'
      },
      {
        id: 'drainage-riser-separate',
        clauseNo: '7.1.5',
        category: '给水排水',
        title: '厨房和卫生间排水立管分设',
        appliesTo: '住宅厨房和卫生间排水立管。',
        requirement: '厨房和卫生间的排水立管应分别设置。',
        numericValues: ['分别设置'],
        keywords: ['厨房排水', '卫生间排水', '排水立管'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70104.htm'
      },
      {
        id: 'drain-pipe-bedroom',
        clauseNo: '7.1.6',
        category: '给水排水',
        title: '排水管道不得穿越卧室',
        appliesTo: '住宅排水管道布置。',
        requirement: '排水管道不应穿越卧室。',
        numericValues: ['不得穿越卧室'],
        keywords: ['排水管道', '卧室', '管道布置'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70104.htm'
      },
      {
        id: 'floor-drain-water-seal',
        clauseNo: '7.1.7',
        category: '给水排水',
        title: '地漏和存水弯水封深度',
        appliesTo: '设置淋浴器或洗衣机的部位、地漏和无存水弯卫生器具。',
        requirement: '设置淋浴器或洗衣机处应设地漏或排水设施，水封深度不应小于50mm；无水封地漏或无存水弯卫生器具连接生活排水管时，应在排水口以下设水封深度不小于50mm的存水弯。',
        numericValues: ['50mm'],
        keywords: ['地漏', '水封', '存水弯', '洗衣机'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70104.htm'
      },
      {
        id: 'pressure-drainage-backflow',
        clauseNo: '7.1.9',
        category: '给水排水',
        title: '低于室外检查井时压力排水',
        appliesTo: '室内地面标高低于室外排水检查井井盖标高的住宅卫生器具和地漏。',
        requirement: '室内地面低于排水管接入的室外检查井井盖标高时，卫生器具和地漏排水应采用压力排水系统，并采取防倒灌措施。',
        numericValues: ['压力排水', '防倒灌'],
        keywords: ['倒灌', '压力排水', '检查井', '地漏'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70104.htm'
      },
      {
        id: 'heating-temperature',
        clauseNo: '7.2.2',
        category: '供暖通风',
        title: '集中供暖室内计算温度',
        appliesTo: '采用集中供暖系统的住宅建筑。',
        requirement: '卧室、起居室和卫生间冬季室内供暖计算温度不应低于18℃，厨房不应低于15℃。',
        numericValues: ['18℃', '15℃'],
        keywords: ['集中供暖', '室内温度', '卧室', '厨房'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70105.htm'
      },
      {
        id: 'dark-toilet-ventilation',
        clauseNo: '7.2.6',
        category: '供暖通风',
        title: '暗卫生间机械通风',
        appliesTo: '无外窗的暗卫生间。',
        requirement: '无外窗的暗卫生间应设防止回流的机械通风设施。',
        numericValues: ['机械通风'],
        keywords: ['暗卫生间', '机械通风', '防回流'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70105.htm'
      },
      {
        id: 'kitchen-smoke-flue',
        clauseNo: '7.2.7',
        category: '供暖通风',
        title: '厨房排烟道防回流',
        appliesTo: '住宅厨房排烟道。',
        requirement: '厨房设置排烟道时，应采取防止支管回流和竖井泄漏的措施。',
        numericValues: ['防回流', '防泄漏'],
        keywords: ['厨房排烟道', '支管回流', '竖井泄漏'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70105.htm'
      },
      {
        id: 'condensate-drain',
        clauseNo: '7.2.8',
        category: '供暖通风',
        title: '空调冷凝水有组织排放',
        appliesTo: '住宅室内空调设备冷凝水排放。',
        requirement: '室内空调设备冷凝水应有组织排放，应设冷凝水排放立管及与主要房间的接口，冷凝水管不应出现倒坡。',
        numericValues: ['有组织排放', '不得倒坡'],
        keywords: ['冷凝水', '空调', '排放立管', '倒坡'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70105.htm'
      },
      {
        id: 'gas-pipe-location',
        clauseNo: '7.3.1',
        category: '燃气安全',
        title: '燃气管道不得设置的空间',
        appliesTo: '住宅建筑燃气管道及设施布置。',
        requirement: '燃气管道及设施不应设置在卧室，以及电梯井、通风道、排气道、暖气沟的竖井或沟槽内。',
        numericValues: ['不得设于卧室'],
        keywords: ['燃气管道', '卧室', '电梯井', '通风道'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70106.htm'
      },
      {
        id: 'gas-room-clear-height',
        clauseNo: '7.3.3',
        category: '燃气安全',
        title: '设置燃具房间净高和连通限制',
        appliesTo: '设置燃气灶、燃气热水器或燃气采暖热水炉等燃具的房间。',
        requirement: '设置燃具的房间室内净高不应低于2.20m，且不应与卧室、兼起居室的卧室等直接连通；贴邻燃具的墙体、地面、台面等应为不燃材料。',
        numericValues: ['2.20m', '不燃材料'],
        keywords: ['燃具', '厨房', '净高', '不燃材料'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70106.htm'
      },
      {
        id: 'gas-exhaust',
        clauseNo: '7.3.4',
        category: '燃气安全',
        title: '燃气排烟排气装置',
        appliesTo: '使用燃气的住宅燃具排烟和排气。',
        requirement: '燃具排烟及排气装置应将烟气排至室外，并具有防倒烟、防串烟措施；排烟及排气管不应穿过卧室，燃气灶不应与燃气热水器或采暖热水炉共用排烟及排气装置。',
        numericValues: ['排至室外', '不得穿过卧室'],
        keywords: ['燃气排烟', '防倒烟', '防串烟', '卧室'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70106.htm'
      },
      {
        id: 'home-distribution-box',
        clauseNo: '7.4.3',
        category: '电气安全',
        title: '家居配电箱保护和安装高度',
        appliesTo: '每套住宅家居配电箱。',
        requirement: '电源插座回路应加设剩余电流动作值不大于30mA的保护电器；单排保护电器配电箱底边距地不应小于1.80m，双排不应小于1.60m；进出电源线应采用铜导体，电源进线截面不应小于10m㎡。',
        numericValues: ['30mA', '1.80m', '1.60m', '10m㎡'],
        keywords: ['配电箱', '剩余电流', '铜导体', '进线截面'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70107.htm'
      },
      {
        id: 'separate-circuits',
        clauseNo: '7.4.4',
        category: '电气安全',
        title: '住宅主要用电回路分设',
        appliesTo: '住宅照明、空调、电热水器、厨房和其他插座回路。',
        requirement: '照明回路、空调电源插座回路、电热水器等2kW及以上设备回路、厨房插座回路和其他功能房间插座回路应分别设置。',
        numericValues: ['2kW'],
        keywords: ['回路分设', '空调插座', '厨房插座', '电热水器'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70107.htm'
      },
      {
        id: 'safe-sockets',
        clauseNo: '7.4.5',
        category: '电气安全',
        title: '安全型插座与专用插座',
        appliesTo: '住宅电源插座布置。',
        requirement: '住宅电源插座均应采用安全型插座，卫生间插座应有防水溅措施；洗衣机、冰箱、排油烟机、排风机、电/燃气热水器、空调器处还应加设专用单相三孔电源插座。',
        numericValues: ['安全型插座', '专用三孔插座'],
        keywords: ['安全型插座', '卫生间插座', '专用插座'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70107.htm'
      },
      {
        id: 'lightning-protection',
        clauseNo: '7.4.6',
        category: '电气安全',
        title: '住宅防雷类别',
        appliesTo: '住宅建筑防雷设计。',
        requirement: '年预计雷击次数大于0.25的住宅建筑应按不低于第二类防雷建筑物采取防雷措施；其他可能发生地闪地区住宅应按不低于第三类防雷建筑物采取措施。',
        numericValues: ['0.25次/年', '第二类防雷', '第三类防雷'],
        keywords: ['防雷', '雷击次数', '住宅电气'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70107.htm'
      },
      {
        id: 'equipotential-bathroom',
        clauseNo: '7.4.7',
        category: '电气安全',
        title: '卫生间等电位联结',
        appliesTo: '装有固定浴盆或淋浴器的住宅卫生间。',
        requirement: '进出住宅建筑的金属管道应与接地装置做等电位联结；装有固定浴盆或淋浴器的卫生间应设等电位联结作为附加防护。',
        numericValues: ['等电位联结'],
        keywords: ['等电位', '卫生间', '淋浴器', '接地'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70107.htm'
      },
      {
        id: 'home-wiring-box',
        clauseNo: '7.5.5',
        category: '智能化',
        title: '家居配线箱和信息端口',
        appliesTo: '住宅通信、有线电视和家居配线箱。',
        requirement: '每套住宅应设家居配线箱，进线管不应少于2根；起居室或兼起居室的卧室应设通信系统信息端口和有线电视系统信息端口。',
        numericValues: ['2根进线管'],
        keywords: ['家居配线箱', '通信端口', '有线电视', '光纤到户'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70108.htm'
      },
      {
        id: 'access-control-release',
        clauseNo: '7.5.6',
        category: '智能化',
        title: '疏散门禁紧急手动解除',
        appliesTo: '住宅疏散通道和出入口处门禁。',
        requirement: '住宅疏散通道上和出入口处门禁应具备紧急情况下就地从内部手动解除的功能。',
        numericValues: ['内部手动解除'],
        keywords: ['门禁', '疏散通道', '紧急解除', '出入口'],
        sourceUrl: 'https://gf.cabr-fire.com/m/article-70108.htm'
      }
    ]
  }),

  standard({
    id: 'gb55019-2021',
    title: '建筑与市政工程无障碍通用规范',
    code: 'GB 55019-2021',
    status: '现行强制性工程建设规范',
    effectiveDate: '2022-04-01',
    category: '无障碍',
    useCases: ['无障碍通道', '轮椅坡道', '无障碍电梯', '无障碍卫生间', '无障碍停车位', '无障碍客房'],
    keywords: ['无障碍', '轮椅', '坡道', '电梯', '卫生间', '停车位', '盲道'],
    officialUrls: officialUrls('GB 55019-2021', [GB55019_PDF, 'http://www.jianbiaoku.com/webarbs/book/160788.shtml']),
    verifiedAt: VERIFIED_AT,
    note: '无障碍条文对尺寸和连续性要求很敏感；本库优先列出方案阶段最容易漏掉的宽度、回转和高度控制。',
    sourceName: 'GB 55019 公开PDF',
    sourceUrl: GB55019_PDF,
    clauses: [
      {
        id: 'continuous-route',
        clauseNo: '2.1.1',
        category: '无障碍流线',
        title: '连续无障碍通行流线',
        appliesTo: '城市开敞空间、建筑场地、建筑内部及其之间。',
        requirement: '应提供连贯的无障碍通行流线，避免建筑入口、公共服务点和室外路径之间断点。',
        numericValues: ['连续流线'],
        keywords: ['无障碍流线', '场地', '入口', '连续']
      },
      {
        id: 'wall-protrusion',
        clauseNo: '2.1.2',
        category: '无障碍通道',
        title: '墙柱突出物控制',
        appliesTo: '无障碍通道、轮椅坡道、楼梯的墙面或柱面固定物。',
        requirement: '突出部分大于100mm且底面距地小于2.00m时，应采取防碰撞处理，并保证有效通行净宽。',
        numericValues: ['100mm', '2.00m'],
        keywords: ['突出物', '防碰撞', '通行净宽']
      },
      {
        id: 'accessible-path-width',
        clauseNo: '2.2.2',
        category: '无障碍通道',
        title: '无障碍通道净宽',
        appliesTo: '普通无障碍通道。',
        requirement: '通行净宽不应小于1.20m。',
        numericValues: ['1.20m'],
        keywords: ['无障碍通道', '净宽', '轮椅']
      },
      {
        id: 'dense-path-width',
        clauseNo: '2.2.2',
        category: '无障碍通道',
        title: '人员密集公共场所无障碍通道净宽',
        appliesTo: '人员密集的公共场所无障碍通道。',
        requirement: '通行净宽不应小于1.80m。',
        numericValues: ['1.80m'],
        keywords: ['人员密集', '无障碍通道', '净宽']
      },
      {
        id: 'wheelchair-ramp-width',
        clauseNo: '2.3',
        category: '轮椅坡道',
        title: '轮椅坡道通行净宽',
        appliesTo: '建筑基地和建筑内部轮椅坡道。',
        requirement: '轮椅坡道通行净宽不应小于1.20m。',
        numericValues: ['1.20m'],
        keywords: ['轮椅坡道', '坡道宽度', '无障碍坡道']
      },
      {
        id: 'wheelchair-ramp-slope',
        clauseNo: '2.3',
        category: '轮椅坡道',
        title: '轮椅坡道坡度',
        appliesTo: '轮椅坡道纵坡和横坡。',
        requirement: '轮椅坡道纵向坡度通常不应大于1:12，横向坡度不应大于1:50；条件允许时室外坡道宜更缓。',
        numericValues: ['1:12', '1:50'],
        keywords: ['坡度', '轮椅坡道', '横坡'],
        note: '坡段高度和长度应按正式条文表格确定。'
      },
      {
        id: 'ramp-rise',
        clauseNo: '2.3',
        category: '轮椅坡道',
        title: '轮椅坡道单段提升高度',
        appliesTo: '轮椅坡道坡段。',
        requirement: '单段坡道提升高度宜控制在750mm以内，超过时应设置休息平台并重新组织坡段。',
        numericValues: ['750mm'],
        keywords: ['坡段高度', '休息平台', '轮椅坡道']
      },
      {
        id: 'accessible-gate',
        clauseNo: '2.4',
        category: '无障碍出入口',
        title: '无障碍检票口和车挡间距',
        appliesTo: '主要出入口、自动检票设备和出入口车挡。',
        requirement: '专供轮椅通行的检票口通道宽度不应小于1.20m；出入口设置车挡时，车挡间距不应小于0.90m。',
        numericValues: ['1.20m', '0.90m'],
        keywords: ['出入口', '检票口', '车挡', '轮椅通道']
      },
      {
        id: 'elevator-lobby',
        clauseNo: '2.6.1',
        category: '无障碍电梯',
        title: '无障碍电梯候梯厅回转空间',
        appliesTo: '无障碍电梯候梯厅。',
        requirement: '电梯门前应设置直径不小于1.50m的轮椅回转空间，公共建筑候梯厅深度不应小于1.80m。',
        numericValues: ['1.50m', '1.80m'],
        keywords: ['无障碍电梯', '候梯厅', '回转空间']
      },
      {
        id: 'elevator-call-button',
        clauseNo: '2.6.1',
        category: '无障碍电梯',
        title: '无障碍电梯呼叫按钮高度',
        appliesTo: '无障碍电梯呼叫按钮。',
        requirement: '呼叫按钮中心距地面高度应为0.85m至1.10m，且距内转角处侧墙距离不应小于400mm。',
        numericValues: ['0.85m', '1.10m', '400mm'],
        keywords: ['呼叫按钮', '按钮高度', '侧墙距离']
      },
      {
        id: 'elevator-car-small',
        clauseNo: '2.6.2',
        category: '无障碍电梯',
        title: '轮椅电梯最小轿厢',
        appliesTo: '满足乘轮椅者使用的电梯轿厢。',
        requirement: '轿厢深度不应小于1.40m，宽度不应小于1.10m。',
        numericValues: ['1.40m', '1.10m'],
        keywords: ['电梯轿厢', '轮椅', '轿厢尺寸']
      },
      {
        id: 'elevator-car-stretcher-wide',
        clauseNo: '2.6.2',
        category: '无障碍电梯',
        title: '轮椅兼担架宽轿厢',
        appliesTo: '同时满足轮椅和担架使用的宽轿厢。',
        requirement: '采用宽轿厢时，深度不应小于1.50m，宽度不应小于1.60m。',
        numericValues: ['1.50m', '1.60m'],
        keywords: ['担架电梯', '宽轿厢', '无障碍电梯']
      },
      {
        id: 'elevator-car-stretcher-deep',
        clauseNo: '2.6.2',
        category: '无障碍电梯',
        title: '轮椅兼担架深轿厢',
        appliesTo: '同时满足轮椅和担架使用的深轿厢。',
        requirement: '采用深轿厢时，深度不应小于2.10m，宽度不应小于1.10m。',
        numericValues: ['2.10m', '1.10m'],
        keywords: ['担架电梯', '深轿厢', '无障碍电梯']
      },
      {
        id: 'accessible-parking-aisle',
        clauseNo: '2.9.2',
        category: '无障碍停车',
        title: '无障碍停车位侧向轮椅通道',
        appliesTo: '无障碍机动车停车位。',
        requirement: '停车位一侧应设置宽度不小于1.20m的轮椅通道，且应与人行通道无高差衔接。',
        numericValues: ['1.20m'],
        keywords: ['无障碍停车位', '轮椅通道', '停车']
      },
      {
        id: 'dressing-room-turning',
        clauseNo: '3.3.2',
        category: '无障碍服务',
        title: '无障碍更衣室回转空间',
        appliesTo: '乘轮椅者使用的储物柜前。',
        requirement: '储物柜前应设置直径不小于1.50m的轮椅回转空间。',
        numericValues: ['1.50m'],
        keywords: ['更衣室', '储物柜', '回转空间']
      },
      {
        id: 'dressing-seat-height',
        clauseNo: '3.3.2',
        category: '无障碍服务',
        title: '无障碍更衣座椅高度',
        appliesTo: '乘轮椅者使用的更衣座椅。',
        requirement: '座椅高度宜为400mm至450mm。',
        numericValues: ['400mm', '450mm'],
        keywords: ['更衣室', '座椅高度', '无障碍']
      },
      {
        id: 'accessible-room-toilet',
        clauseNo: '3.4.4',
        category: '无障碍卫生间',
        title: '无障碍客房和住房内卫生间',
        appliesTo: '无障碍客房、无障碍住房和无障碍居室。',
        requirement: '应设置无障碍卫生间，保证轮椅进出并提供轮椅回转空间、无障碍坐便器、洗手盆、淋浴或盆浴设施及救助呼叫装置。',
        numericValues: ['轮椅回转空间'],
        keywords: ['无障碍卫生间', '客房', '住房', '呼叫装置']
      },
      {
        id: 'bedside-aisle',
        clauseNo: '3.4.6',
        category: '无障碍客房',
        title: '轮椅上下床侧通道',
        appliesTo: '无障碍客房和住房内床侧通道。',
        requirement: '乘轮椅者上下床用的床侧通道宽度不应小于1.20m。',
        numericValues: ['1.20m'],
        keywords: ['床侧通道', '无障碍客房', '轮椅']
      },
      {
        id: 'window-handle',
        clauseNo: '3.4.7',
        category: '无障碍客房',
        title: '可开启窗执手高度和力度',
        appliesTo: '无障碍客房、无障碍住房、居室内可开启窗。',
        requirement: '窗户可开启扇执手或启闭开关距地面高度应为0.85m至1.00m，手动操作力度不应大于25N。',
        numericValues: ['0.85m', '1.00m', '25N'],
        keywords: ['窗执手', '启闭开关', '无障碍客房']
      }
    ]
  }),

  standard({
    id: 'gb50352-2019',
    title: '民用建筑设计统一标准',
    code: 'GB 50352-2019',
    status: '现行国家标准',
    effectiveDate: '2019-10-01',
    category: '民用建筑',
    useCases: ['栏杆', '楼梯净高', '楼梯井', '道路红线', '公共空间'],
    keywords: ['民用建筑', '栏杆', '楼梯', '净高', '红线', '儿童安全'],
    officialUrls: officialUrls('GB 50352-2019', [GB50352_PDF]),
    verifiedAt: VERIFIED_AT,
    note: '部分强制性条文已被GB 55031-2022替代或废止；与通用规范不一致时，应以现行强制性通用规范为准。',
    sourceName: 'GB 50352 公开PDF',
    sourceUrl: GB50352_PDF,
    clauses: [
      {
        id: 'red-line-objects',
        clauseNo: '4.3.1',
        category: '红线与退距',
        title: '不得突出道路红线或用地红线的附属设施',
        appliesTo: '地下设施、阳台、雨篷、挑檐、台阶、坡道、花池、围墙、平台、地下室出入口等。',
        requirement: '除规范允许并经批准的特殊设施外，建筑物及附属设施不应突出道路红线或用地红线建造。',
        numericValues: ['道路红线', '用地红线'],
        keywords: ['红线', '退距', '地下设施', '雨篷', '台阶']
      },
      {
        id: 'guardrail-24',
        clauseNo: '6.7.3',
        category: '栏杆',
        title: '24m以下临空栏杆高度',
        appliesTo: '阳台、外廊、室内回廊、内天井、上人屋面及室外楼梯等临空处。',
        requirement: '临空高度在24m以下时，栏杆或栏板高度不应低于1.05m。',
        numericValues: ['24m', '1.05m'],
        keywords: ['栏杆', '临空高度', '1.05m'],
        note: 'GB 55031-2022已将民用建筑临空栏杆基本高度统一为不小于1.10m，实际项目应优先核对现行通用规范。'
      },
      {
        id: 'guardrail-over24',
        clauseNo: '6.7.3',
        category: '栏杆',
        title: '24m及以上临空栏杆高度',
        appliesTo: '临空高度在24m及以上的临空栏杆。',
        requirement: '栏杆或栏板高度不应低于1.10m。',
        numericValues: ['24m', '1.10m'],
        keywords: ['栏杆', '临空高度', '1.10m']
      },
      {
        id: 'atrium-guardrail',
        clauseNo: '6.7.3',
        category: '栏杆',
        title: '公共场所中庭栏杆高度',
        appliesTo: '学校、商业、医院、旅馆、交通等建筑公共场所临中庭栏杆。',
        requirement: '临中庭栏杆或栏板高度不应小于1.20m。',
        numericValues: ['1.20m'],
        keywords: ['中庭', '公共场所', '栏杆高度']
      },
      {
        id: 'guardrail-child-gap',
        clauseNo: '6.7.4',
        category: '儿童安全',
        title: '儿童活动场所栏杆净距',
        appliesTo: '住宅、托儿所、幼儿园、中小学及其他少年儿童专用活动场所栏杆。',
        requirement: '栏杆应防止攀爬；采用垂直杆件时，杆件净间距不应大于0.11m。',
        numericValues: ['0.11m'],
        keywords: ['儿童', '栏杆净距', '防攀爬']
      },
      {
        id: 'stair-clear-height',
        clauseNo: '6.8.6',
        category: '楼梯',
        title: '楼梯平台和梯段净高',
        appliesTo: '民用建筑楼梯平台上部、下部过道和梯段。',
        requirement: '楼梯平台上部及下部过道处净高不应小于2.00m，梯段净高不应小于2.20m。',
        numericValues: ['2.00m', '2.20m'],
        keywords: ['楼梯净高', '梯段净高', '平台净高']
      },
      {
        id: 'children-stairwell',
        clauseNo: '6.8.9',
        category: '儿童安全',
        title: '少年儿童活动场所楼梯井防坠',
        appliesTo: '托儿所、幼儿园、中小学校及其他少年儿童专用活动场所。',
        requirement: '当楼梯井净宽大于0.20m时，必须采取防止少年儿童坠落措施。',
        numericValues: ['0.20m'],
        keywords: ['楼梯井', '儿童', '防坠落']
      },
      {
        id: 'civil-building-height-class',
        clauseNo: '3.1.2',
        category: '建筑高度',
        title: '民用建筑高度分类',
        appliesTo: '住宅建筑、公共建筑及超高层建筑的方案分类判断。',
        requirement: '住宅高度不大于27.0m、公共建筑高度不大于24.0m及大于24.0m的单层公共建筑属于低层或多层民用建筑；住宅大于27.0m、非单层公共建筑大于24.0m且不大于100.0m属于高层民用建筑；高度大于100.0m属于超高层建筑。',
        numericValues: ['27.0m', '24.0m', '100.0m'],
        keywords: ['建筑高度', '高层', '超高层', '住宅', '公共建筑']
      },
      {
        id: 'base-connection-road',
        clauseNo: '4.2.1',
        category: '基地道路',
        title: '建筑基地连接道路宽度',
        appliesTo: '建筑基地未直接邻接城市道路或镇区道路、需设置连接道路的情况。',
        requirement: '基地内建筑面积不大于3000㎡时，连接道路宽度不应小于4.0m；建筑面积大于3000㎡且仅有一条连接道路时不应小于7.0m；有两条及以上连接道路时，单条宽度不应小于4.0m。',
        numericValues: ['3000㎡', '4.0m', '7.0m'],
        keywords: ['基地道路', '连接道路', '出入口', '道路宽度']
      },
      {
        id: 'vehicle-entrance-distance',
        clauseNo: '4.2.4',
        category: '出入口',
        title: '机动车出入口与交叉口及公共设施距离',
        appliesTo: '建筑基地机动车出入口选址。',
        requirement: '中等城市、大城市主干路交叉口自道路红线交叉点起70.0m范围内不应设置机动车出入口；出入口距人行横道、人行天桥、人行地道最近边缘不应小于5.0m，距地铁出入口和公交站台边缘不应小于15.0m，距公园、学校及儿童、老年人、残疾人使用建筑的出入口最近边缘不应小于20.0m。',
        numericValues: ['70.0m', '5.0m', '15.0m', '20.0m'],
        keywords: ['机动车出入口', '主干路', '人行横道', '地铁出入口', '公交站台', '学校']
      },
      {
        id: 'large-public-base-entry',
        clauseNo: '4.2.5',
        category: '公共空间',
        title: '大型人员密集建筑基地出入口',
        appliesTo: '大型、特大型交通、文化、体育、娱乐、商业等人员密集建筑基地。',
        requirement: '基地与城市道路邻接的总长度不应小于基地周长的1/6；基地出入口不应少于2个，且不宜设置在同一条城市道路上；主要出入口前应设置人员集散场地。',
        numericValues: ['1/6', '2个'],
        keywords: ['人员密集', '基地出入口', '集散场地', '城市道路']
      },
      {
        id: 'existing-projection-clearance',
        clauseNo: '4.3.2',
        category: '红线与退距',
        title: '既有建筑改造突出物净空控制',
        appliesTo: '经规划部门批准、既有建筑改造中确需突出道路红线的建筑突出物。',
        requirement: '人行道上空2.5m以下不应突出凸窗、窗扇、窗罩等构件；2.5m及以上突出时深度不应大于0.6m。3.0m以下不应突出雨篷、挑檐或空调机位；3.0m及以上雨篷、挑檐突出深度不应大于2.0m，空调机位突出深度不应大于0.6m。',
        numericValues: ['2.5m', '0.6m', '3.0m', '2.0m'],
        keywords: ['既有建筑', '突出物', '雨篷', '空调机位', '道路红线'],
        note: '新建项目和地方规划管控应以规划条件、道路红线及当地审查口径为准。'
      },
      {
        id: 'building-connector-width',
        clauseNo: '4.4.4',
        category: '公共空间',
        title: '交通功能建筑连接体净宽',
        appliesTo: '跨越道路红线、用地边界或建筑控制线的交通功能建筑连接体。',
        requirement: '交通功能建筑连接体净宽不宜大于9.0m；地上连接体净宽不宜小于3.0m，地下连接体净宽不宜小于4.0m。',
        numericValues: ['9.0m', '3.0m', '4.0m'],
        keywords: ['建筑连接体', '连廊', '地下连接', '净宽']
      },
      {
        id: 'site-road-basic-width',
        clauseNo: '5.2.2',
        category: '基地道路',
        title: '基地道路基本宽度',
        appliesTo: '建筑基地内机动车道路、人行道路和转弯道路。',
        requirement: '单车道路宽不应小于4.0m；住宅区双车道路宽不应小于6.0m，其他基地道路宽不应小于7.0m；人行道路宽不应小于1.5m；道路转弯半径不应小于3.0m。',
        numericValues: ['4.0m', '6.0m', '7.0m', '1.5m', '3.0m'],
        keywords: ['基地道路', '单车道', '双车道', '人行道', '转弯半径']
      },
      {
        id: 'dead-end-road-turnaround',
        clauseNo: '5.2.2',
        category: '基地道路',
        title: '尽端式道路回车场',
        appliesTo: '基地内尽端式道路。',
        requirement: '尽端式道路长度大于120.0m时，应在尽端设置不小于12.0m×12.0m的回车场地。',
        numericValues: ['120.0m', '12.0m×12.0m'],
        keywords: ['尽端道路', '回车场地', '道路长度']
      },
      {
        id: 'garage-entrance-buffer',
        clauseNo: '5.2.4',
        category: '地下空间',
        title: '地下车库出入口缓冲段',
        appliesTo: '建筑基地内地下机动车车库出入口与连接道路。',
        requirement: '车库出入口与基地道路垂直或平行衔接时，缓冲段长度不应小于5.5m；直接连接基地外城市道路时，缓冲段长度不宜小于7.5m；与基地内道路连接处转弯半径不宜小于5.5m。',
        numericValues: ['5.5m', '7.5m'],
        keywords: ['地下车库', '出入口', '缓冲段', '转弯半径']
      },
      {
        id: 'outdoor-parking-entrance-count',
        clauseNo: '5.2.6',
        category: '停车场',
        title: '室外机动车停车场出入口数量',
        appliesTo: '室外机动车停车场出入口设置。',
        requirement: '停车数50辆及以下可设1个出入口；51辆至300辆应设2个出入口；301辆至500辆应设2个双向行驶出入口；大于500辆应设3个出入口。',
        numericValues: ['50辆', '51辆～300辆', '301辆～500辆', '500辆', '1个', '2个', '3个'],
        keywords: ['停车场', '出入口数量', '室外停车']
      },
      {
        id: 'outdoor-parking-entrance-width',
        clauseNo: '5.2.7',
        category: '停车场',
        title: '室外停车场出入口间距和宽度',
        appliesTo: '室外机动车停车场出入口。',
        requirement: '停车位大于300辆的停车场，各出入口间距不应小于15.0m；单向行驶出入口宽度不应小于4.0m，双向行驶出入口宽度不应小于7.0m。',
        numericValues: ['300辆', '15.0m', '4.0m', '7.0m'],
        keywords: ['停车场出入口', '单向出入口', '双向出入口', '出入口间距']
      },
      {
        id: 'site-vertical-slope',
        clauseNo: '5.3.1',
        category: '竖向与排水',
        title: '场地自然坡度与排水控制',
        appliesTo: '建筑基地竖向设计和场地排水。',
        requirement: '基地自然坡度小于5%时宜采用平坡式布置，大于8%时宜采用台阶式布置；基地地面坡度不宜小于0.2%，当小于0.2%时宜采用多坡向或特殊排水措施；场地设计标高宜比周边市政道路最低路段标高高0.2m以上。',
        numericValues: ['5%', '8%', '0.2%', '0.2m'],
        keywords: ['竖向设计', '场地坡度', '排水', '台阶式']
      },
      {
        id: 'site-road-slope',
        clauseNo: '5.3.2',
        category: '竖向与排水',
        title: '基地道路纵坡控制',
        appliesTo: '基地内机动车道、非机动车道和步行道纵坡。',
        requirement: '机动车道纵坡不应小于0.3%且不应大于8%；非机动车道纵坡不应小于0.2%，最大纵坡不宜大于2.5%，困难时不应大于3.5%；步行道纵坡不应小于0.2%且不应大于8%，积雪或冰冻地区不应大于4%。',
        numericValues: ['0.3%', '8%', '0.2%', '2.5%', '3.5%', '4%'],
        keywords: ['道路纵坡', '机动车道', '非机动车道', '步行道']
      },
      {
        id: 'sunken-yard-drainage',
        clauseNo: '5.3.4',
        category: '竖向与排水',
        title: '下沉庭院和车库坡道截水沟',
        appliesTo: '下沉庭院周边、车库坡道出入口。',
        requirement: '下沉庭院周边和车库坡道出入口处应设置截水沟。',
        numericValues: ['截水沟'],
        keywords: ['下沉庭院', '车库坡道', '截水沟', '防倒灌']
      },
      {
        id: 'bottom-entrance-backflow',
        clauseNo: '5.3.5',
        category: '竖向与排水',
        title: '建筑底层出入口防雨水回流',
        appliesTo: '建筑物底层出入口。',
        requirement: '建筑物底层出入口处应采取措施防止室外地面雨水回流。',
        numericValues: ['防回流'],
        keywords: ['底层出入口', '雨水回流', '排水']
      }
    ]
  }),

  standard({
    id: 'gb50096-2011',
    title: '住宅设计规范',
    code: 'GB 50096-2011',
    status: '现行国家标准',
    effectiveDate: '2012-08-01',
    category: '住宅',
    useCases: ['住宅净高', '厨房卫生间', '阳台栏杆', '住宅套型', '坡屋顶空间'],
    keywords: ['住宅', '净高', '阳台', '厨房', '卫生间', '栏杆', '坡屋顶'],
    officialUrls: officialUrls('GB 50096-2011', [GB50096_PDF]),
    verifiedAt: VERIFIED_AT,
    note: '住宅通用安全条文仍应与GB 55031-2022、GB 55037-2022等现行强制性通用规范一并核对。',
    sourceName: 'GB 50096 公开PDF',
    sourceUrl: GB50096_PDF,
    clauses: [
      {
        id: 'basic-rooms',
        clauseNo: '5.1.1',
        category: '套内空间',
        title: '住宅基本功能空间',
        appliesTo: '住宅套型设计。',
        requirement: '每套住宅应设置卧室、起居室、厨房和卫生间等基本功能空间。',
        numericValues: ['每套住宅'],
        keywords: ['套型', '卧室', '起居室', '厨房', '卫生间']
      },
      {
        id: 'kitchen-facilities',
        clauseNo: '5.3.3',
        category: '厨房',
        title: '厨房基本设施预留',
        appliesTo: '住宅厨房。',
        requirement: '厨房应设置洗涤池、案台、炉灶、排油烟机、热水器等设施，或预留相应位置和条件。',
        numericValues: ['设施预留'],
        keywords: ['厨房', '洗涤池', '炉灶', '排油烟机']
      },
      {
        id: 'toilet-no-open-living',
        clauseNo: '5.4.3',
        category: '卫生间',
        title: '无前室卫生间门不得直开起居室或厨房',
        appliesTo: '住宅无前室卫生间。',
        requirement: '无前室的卫生间门不应直接开向起居室或厨房。',
        numericValues: ['不得直开'],
        keywords: ['卫生间门', '起居室', '厨房']
      },
      {
        id: 'toilet-over-room',
        clauseNo: '5.4.4',
        category: '卫生间',
        title: '卫生间不得压下层主要房间',
        appliesTo: '住宅上下层套内空间。',
        requirement: '卫生间不应直接布置在下层住户卧室、起居室、厨房和餐厅的上层。',
        numericValues: ['不得布置'],
        keywords: ['卫生间', '下层住户', '防水']
      },
      {
        id: 'toilet-over-own-room',
        clauseNo: '5.4.5',
        category: '卫生间',
        title: '本套内卫生间位于主要房间上方的措施',
        appliesTo: '跃层或复式住宅本套内上下层空间。',
        requirement: '当卫生间布置在本套内卧室、起居室、厨房和餐厅上层时，应采取防水和便于检修的措施。',
        numericValues: ['防水', '检修'],
        keywords: ['复式', '卫生间', '防水', '检修']
      },
      {
        id: 'floor-height',
        clauseNo: '5.5.1',
        category: '净高',
        title: '住宅层高建议值',
        appliesTo: '住宅层高控制。',
        requirement: '住宅层高宜为2.80m。',
        numericValues: ['2.80m'],
        keywords: ['住宅层高', '层高']
      },
      {
        id: 'bed-living-clear-height',
        clauseNo: '5.5.2',
        category: '净高',
        title: '卧室和起居室室内净高',
        appliesTo: '住宅卧室、起居室。',
        requirement: '室内净高不应低于2.40m；局部净高不应低于2.10m，且局部净高面积不应大于室内使用面积的1/3。',
        numericValues: ['2.40m', '2.10m', '1/3'],
        keywords: ['卧室', '起居室', '净高', '局部净高']
      },
      {
        id: 'slope-roof-clear-height',
        clauseNo: '5.5.3',
        category: '净高',
        title: '坡屋顶内卧室和起居室净高',
        appliesTo: '利用坡屋顶内空间作为卧室、起居室。',
        requirement: '至少1/2使用面积的室内净高不应低于2.10m。',
        numericValues: ['1/2', '2.10m'],
        keywords: ['坡屋顶', '卧室', '起居室', '净高']
      },
      {
        id: 'kitchen-toilet-clear-height',
        clauseNo: '5.5.4',
        category: '净高',
        title: '厨房和卫生间室内净高',
        appliesTo: '住宅厨房和卫生间。',
        requirement: '室内净高不应低于2.20m。',
        numericValues: ['2.20m'],
        keywords: ['厨房净高', '卫生间净高']
      },
      {
        id: 'pipe-clear-height',
        clauseNo: '5.5.5',
        category: '净高',
        title: '厨房卫生间排水横管下净距',
        appliesTo: '厨房、卫生间内排水横管。',
        requirement: '排水横管下表面与楼面、地面净距不得低于1.90m，且不得影响门窗扇开启。',
        numericValues: ['1.90m'],
        keywords: ['排水横管', '厨房', '卫生间', '净距']
      },
      {
        id: 'balcony-child',
        clauseNo: '5.6.2',
        category: '栏杆',
        title: '住宅阳台栏杆防儿童攀登',
        appliesTo: '住宅阳台栏杆。',
        requirement: '阳台栏杆应采用防止儿童攀登的构造，垂直杆件净距不应大于0.11m；放置花盆处应采取防坠落措施。',
        numericValues: ['0.11m'],
        keywords: ['阳台栏杆', '儿童', '防攀爬', '花盆']
      },
      {
        id: 'balcony-height-low',
        clauseNo: '5.6.3',
        category: '栏杆',
        title: '六层及以下住宅阳台栏杆高度',
        appliesTo: '六层及六层以下住宅阳台。',
        requirement: '阳台栏板或栏杆净高不应低于1.05m。',
        numericValues: ['六层', '1.05m'],
        keywords: ['阳台栏杆', '住宅', '六层']
      },
      {
        id: 'balcony-height-high',
        clauseNo: '5.6.3',
        category: '栏杆',
        title: '七层及以上住宅阳台栏杆高度',
        appliesTo: '七层及七层以上住宅阳台。',
        requirement: '阳台栏板或栏杆净高不应低于1.10m。',
        numericValues: ['七层', '1.10m'],
        keywords: ['阳台栏杆', '住宅', '七层']
      },
      {
        id: 'low-window-protection',
        clauseNo: '5.8.1',
        category: '安全防护',
        title: '低窗台外窗防护',
        appliesTo: '窗外没有阳台或平台的住宅外窗。',
        requirement: '窗台距楼面、地面净高低于0.90m时，应设置防护设施。',
        numericValues: ['0.90m'],
        keywords: ['低窗台', '外窗', '防护']
      },
      {
        id: 'suite-min-area',
        clauseNo: '5.1.2',
        category: '套内空间',
        title: '住宅套型最小使用面积',
        appliesTo: '由卧室、起居室、厨房、卫生间等组成的住宅套型及最小套型。',
        requirement: '由卧室、起居室、厨房、卫生间等组成的套型，使用面积不应小于30㎡；由兼起居的卧室、厨房、卫生间等组成的最小套型，使用面积不应小于22㎡。',
        numericValues: ['30㎡', '22㎡'],
        keywords: ['套型面积', '最小套型', '使用面积']
      },
      {
        id: 'bedroom-min-area',
        clauseNo: '5.2.1',
        category: '套内空间',
        title: '卧室最小使用面积',
        appliesTo: '住宅双人卧室、单人卧室和兼起居卧室。',
        requirement: '双人卧室使用面积不应小于9㎡，单人卧室不应小于5㎡，兼起居的卧室不应小于12㎡。',
        numericValues: ['9㎡', '5㎡', '12㎡'],
        keywords: ['卧室面积', '双人卧室', '单人卧室', '兼起居卧室']
      },
      {
        id: 'living-room-min-area',
        clauseNo: '5.2.2',
        category: '套内空间',
        title: '起居室最小使用面积',
        appliesTo: '住宅起居室或起居厅。',
        requirement: '起居室（厅）的使用面积不应小于10㎡。',
        numericValues: ['10㎡'],
        keywords: ['起居室', '客厅', '使用面积']
      },
      {
        id: 'living-wall-and-dark-dining',
        clauseNo: '5.2.3、5.2.4',
        category: '套内空间',
        title: '起居室家具墙面与暗餐厅面积',
        appliesTo: '住宅起居室家具布置及无直接采光的餐厅、过厅。',
        requirement: '起居室内布置家具的墙面直线长度宜大于3m；无直接采光的餐厅、过厅等使用面积不宜大于10㎡。',
        numericValues: ['3m', '10㎡'],
        keywords: ['家具墙面', '无直接采光', '餐厅', '过厅']
      },
      {
        id: 'kitchen-min-area',
        clauseNo: '5.3.1',
        category: '厨房',
        title: '住宅厨房最小使用面积',
        appliesTo: '普通住宅套型厨房及最小套型厨房。',
        requirement: '普通住宅套型的厨房使用面积不应小于4.0㎡；最小套型的厨房使用面积不应小于3.5㎡。',
        numericValues: ['4.0㎡', '3.5㎡'],
        keywords: ['厨房面积', '最小厨房', '套型']
      },
      {
        id: 'kitchen-clear-width',
        clauseNo: '5.3.5',
        category: '厨房',
        title: '厨房单排与双排设备净宽',
        appliesTo: '单排或双排布置设备的住宅厨房。',
        requirement: '单排布置设备的厨房净宽不应小于1.50m；双排布置设备时，两排设备之间净距不应小于0.90m。',
        numericValues: ['1.50m', '0.90m'],
        keywords: ['厨房净宽', '单排厨房', '双排厨房']
      },
      {
        id: 'toilet-min-area-basic',
        clauseNo: '5.4.1',
        category: '卫生间',
        title: '三件卫生设备集中卫生间面积',
        appliesTo: '便器、洗浴器、洗面器三件卫生设备集中配置的住宅卫生间。',
        requirement: '三件卫生设备集中配置的卫生间，使用面积不应小于2.50㎡。',
        numericValues: ['2.50㎡'],
        keywords: ['卫生间面积', '便器', '洗浴器', '洗面器']
      },
      {
        id: 'toilet-combination-area',
        clauseNo: '5.4.2',
        category: '卫生间',
        title: '住宅卫生间设备组合面积',
        appliesTo: '按不同卫生设备组合设置的住宅卫生间。',
        requirement: '设便器和洗面器时不应小于1.80㎡；设便器和洗浴器时不应小于2.00㎡；设洗面器和洗浴器时不应小于2.00㎡；设洗面器和洗衣机时不应小于1.80㎡；单设便器时不应小于1.10㎡。',
        numericValues: ['1.80㎡', '2.00㎡', '1.10㎡'],
        keywords: ['卫生间组合', '便器', '洗面器', '洗浴器', '洗衣机']
      },
      {
        id: 'internal-corridor-width',
        clauseNo: '5.7.1',
        category: '过道',
        title: '套内过道净宽',
        appliesTo: '住宅套内入口过道、通往卧室和起居室的过道、通往厨房卫生间的过道。',
        requirement: '套内入口过道净宽不宜小于1.20m；通往卧室、起居室的过道净宽不应小于1.00m；通往厨房、卫生间、贮藏室的过道净宽不应小于0.90m。',
        numericValues: ['1.20m', '1.00m', '0.90m'],
        keywords: ['套内过道', '入口过道', '过道净宽']
      },
      {
        id: 'internal-stair-width',
        clauseNo: '5.7.3',
        category: '楼梯',
        title: '套内楼梯梯段净宽',
        appliesTo: '住宅套内楼梯。',
        requirement: '套内楼梯一边临空时，梯段净宽不应小于0.75m；两侧有墙时，墙面之间净宽不应小于0.90m，并应在其中一侧墙面设置扶手。',
        numericValues: ['0.75m', '0.90m'],
        keywords: ['套内楼梯', '梯段净宽', '扶手']
      },
      {
        id: 'internal-stair-step',
        clauseNo: '5.7.4',
        category: '楼梯',
        title: '套内楼梯踏步尺寸',
        appliesTo: '住宅套内楼梯及扇形踏步。',
        requirement: '套内楼梯踏步宽度不应小于0.22m，高度不应大于0.20m；扇形踏步在距扶手中心0.25m处宽度不应小于0.22m。',
        numericValues: ['0.22m', '0.20m', '0.25m'],
        keywords: ['套内楼梯', '踏步宽度', '踏步高度', '扇形踏步']
      },
      {
        id: 'bay-window-protection',
        clauseNo: '5.8.2',
        category: '安全防护',
        title: '住宅凸窗防护高度',
        appliesTo: '住宅凸窗及可开启窗扇洞口。',
        requirement: '凸窗窗台高度低于或等于0.45m时，防护高度从窗台面起算不应低于0.90m；可开启窗扇窗洞口底距窗台面净高低于0.90m时，窗洞口处应有防护措施，防护高度从窗台面起算不应低于0.90m。',
        numericValues: ['0.45m', '0.90m'],
        keywords: ['凸窗', '防护高度', '可开启窗']
      },
      {
        id: 'kitchen-toilet-door-vent',
        clauseNo: '5.8.6',
        category: '门窗',
        title: '厨房卫生间门通风构造',
        appliesTo: '住宅厨房和卫生间门。',
        requirement: '厨房和卫生间门下部应设置有效截面积不小于0.02㎡的固定百叶，也可距地面留出不小于30mm的缝隙。',
        numericValues: ['0.02㎡', '30mm'],
        keywords: ['厨房门', '卫生间门', '百叶', '门缝']
      },
      {
        id: 'public-entrance-step',
        clauseNo: '6.1.2、6.1.4',
        category: '台阶坡道',
        title: '公共出入口台阶防护与踏步',
        appliesTo: '住宅公共出入口台阶。',
        requirement: '公共出入口台阶高度超过0.70m且侧面临空时，应设置净高不低于1.05m的防护设施；台阶踏步宽度不宜小于0.30m，踏步高度不宜大于0.15m且不宜小于0.10m；台阶宽度大于1.80m时，两侧宜设置0.90m高栏杆扶手。',
        numericValues: ['0.70m', '1.05m', '0.30m', '0.15m', '0.10m', '1.80m', '0.90m'],
        keywords: ['公共出入口', '台阶', '踏步', '防护设施', '扶手']
      },
      {
        id: 'residential-safe-exit-thresholds',
        clauseNo: '6.2.1～6.2.3',
        category: '安全疏散',
        title: '住宅安全出口数量初判',
        appliesTo: '不同层数住宅单元的安全出口数量初步判断。',
        requirement: '十层以下住宅，当单元任一层建筑面积大于650㎡或任一套房户门至安全出口距离大于15m时，每层安全出口不应少于2个；十层至十八层住宅相同面积条件下，户门至安全出口距离阈值为10m；十九层及以上住宅每层住宅单元安全出口不应少于2个。',
        numericValues: ['650㎡', '15m', '10m', '2个', '十层', '十八层', '十九层'],
        keywords: ['安全出口', '住宅单元', '疏散距离', '建筑面积']
      },
      {
        id: 'safe-exit-separation',
        clauseNo: '6.2.4',
        category: '安全疏散',
        title: '住宅两个安全出口距离',
        appliesTo: '住宅安全出口分散布置。',
        requirement: '安全出口应分散布置，两个安全出口的距离不应小于5m。',
        numericValues: ['5m'],
        keywords: ['安全出口', '分散布置', '出口距离']
      },
      {
        id: 'common-stair-width',
        clauseNo: '6.3.1',
        category: '楼梯',
        title: '住宅公共楼梯梯段净宽',
        appliesTo: '住宅公共楼梯。',
        requirement: '楼梯梯段净宽不应小于1.10m；不超过六层且一边设有栏杆的住宅楼梯梯段净宽不应小于1.00m。',
        numericValues: ['1.10m', '1.00m', '六层'],
        keywords: ['公共楼梯', '梯段净宽', '住宅楼梯']
      },
      {
        id: 'common-stair-step-handrail',
        clauseNo: '6.3.2',
        category: '楼梯',
        title: '住宅公共楼梯踏步和扶手',
        appliesTo: '住宅公共楼梯踏步、扶手和栏杆。',
        requirement: '楼梯踏步宽度不应小于0.26m，踏步高度不应大于0.175m；扶手高度不应小于0.90m；水平段栏杆长度大于0.50m时，扶手高度不应小于1.05m；栏杆垂直杆件间净空不应大于0.11m。',
        numericValues: ['0.26m', '0.175m', '0.90m', '0.50m', '1.05m', '0.11m'],
        keywords: ['楼梯踏步', '扶手高度', '栏杆净距']
      },
      {
        id: 'common-stair-platform',
        clauseNo: '6.3.3、6.3.4',
        category: '楼梯',
        title: '住宅楼梯平台净宽和净高',
        appliesTo: '住宅公共楼梯平台、入口处及剪刀梯平台。',
        requirement: '楼梯平台净宽不应小于楼梯梯段净宽，且不得小于1.20m；平台结构下缘至人行通道的垂直高度不应低于2.00m；入口处地坪与室外地面高差不应小于0.10m；剪刀梯平台净宽不得小于1.30m。',
        numericValues: ['1.20m', '2.00m', '0.10m', '1.30m'],
        keywords: ['楼梯平台', '平台净宽', '剪刀梯', '净高']
      },
      {
        id: 'residential-elevator-required',
        clauseNo: '6.4.1',
        category: '电梯',
        title: '住宅设置电梯条件',
        appliesTo: '住宅层数或住户入口层高度达到设置电梯条件的住宅。',
        requirement: '七层及以上住宅或住户入口层楼面距室外设计地面高度超过16m时必须设置电梯；底层为商店、架空层、贮存空间等情形也应按住户入口层高度超过16m进行电梯设置判断。',
        numericValues: ['七层', '16m'],
        keywords: ['电梯', '住宅层数', '入口层高度']
      },
      {
        id: 'stretcher-elevator',
        clauseNo: '6.4.2',
        category: '电梯',
        title: '十二层及以上住宅电梯数量和担架电梯',
        appliesTo: '十二层及十二层以上住宅。',
        requirement: '每栋楼设置电梯不应少于两台，其中应设置一台可容纳担架的电梯。',
        numericValues: ['十二层', '两台', '担架电梯'],
        keywords: ['担架电梯', '电梯数量', '十二层']
      },
      {
        id: 'elevator-hall-depth',
        clauseNo: '6.4.6',
        category: '电梯',
        title: '住宅候梯厅深度',
        appliesTo: '住宅电梯候梯厅。',
        requirement: '候梯厅深度不应小于多台电梯中最大轿厢的深度，且不应小于1.50m。',
        numericValues: ['1.50m'],
        keywords: ['候梯厅', '电梯厅', '候梯厅深度']
      },
      {
        id: 'common-corridor-width',
        clauseNo: '6.5.1',
        category: '过道',
        title: '住宅公共走廊净宽和净高',
        appliesTo: '住宅作为主要通道的外廊和走廊通道。',
        requirement: '走廊通道净宽不应小于1.20m，局部净高不应低于2.00m。',
        numericValues: ['1.20m', '2.00m'],
        keywords: ['公共走廊', '外廊', '通道净宽', '局部净高']
      },
      {
        id: 'accessible-residential-entry',
        clauseNo: '6.6.2～6.6.4',
        category: '无障碍',
        title: '住宅无障碍入口平台和通道',
        appliesTo: '七层及以上住宅的建筑入口、入口平台、候梯厅和公共走道。',
        requirement: '建筑入口设台阶时应同时设置轮椅坡道和扶手；供轮椅通行的门净宽不应小于0.8m；七层及以上住宅建筑入口平台宽度不应小于2.00m，七层以下不应小于1.50m；供轮椅通行的走道和通道净宽不应小于1.20m。',
        numericValues: ['0.8m', '2.00m', '1.50m', '1.20m'],
        keywords: ['无障碍入口', '轮椅坡道', '入口平台', '通道净宽']
      },
      {
        id: 'exhaust-duct-size',
        clauseNo: '6.8.2、6.8.5',
        category: '排气通风',
        title: '厨房卫生间共用排气道接口和风帽',
        appliesTo: '住宅厨房、卫生间共用排气道。',
        requirement: '厨房排气道接口直径应大于150mm，卫生间排气道接口直径应大于80mm；排气道出口设在上人屋面或住户平台上时，应高出屋面或平台地面2m，周围4m内有门窗时应高出门窗上皮0.6m。',
        numericValues: ['150mm', '80mm', '2m', '4m', '0.6m'],
        keywords: ['排气道', '厨房', '卫生间', '风帽', '上人屋面']
      },
      {
        id: 'basement-living-space',
        clauseNo: '6.9.1、6.9.3、6.9.4',
        category: '地下空间',
        title: '住宅地下室功能和净高',
        appliesTo: '住宅地下室、半地下室、自行车库、设备用房和机动车停车位。',
        requirement: '卧室、起居室、厨房不应布置在地下室；地下室、半地下室做自行车库和设备用房时净高不应低于2.00m；地上架空层及半地下室做机动车停车位时净高不应低于2.20m。',
        numericValues: ['2.00m', '2.20m'],
        keywords: ['地下室', '半地下室', '自行车库', '设备用房', '停车位']
      },
      {
        id: 'residential-daylight',
        clauseNo: '7.1.1～7.1.7',
        category: '采光日照',
        title: '住宅日照和天然采光基本要求',
        appliesTo: '住宅居住空间、卧室、起居室、厨房和楼梯间。',
        requirement: '每套住宅至少应有一个居住空间获得冬季日照；需获得冬季日照的居住空间窗洞开口宽度不应小于0.60m；卧室、起居室、厨房采光系数不应低于1%，采光窗洞口窗地面积比不应低于1/7；楼梯间设采光窗时采光系数不应低于0.5%，窗地面积比不应低于1/12；采光窗下沿低于0.50m的窗洞口面积不计入采光面积。',
        numericValues: ['0.60m', '1%', '1/7', '0.5%', '1/12', '0.50m'],
        keywords: ['日照', '采光', '窗地比', '采光系数', '楼梯间']
      },
      {
        id: 'residential-ventilation',
        clauseNo: '7.2.3、7.2.4',
        category: '通风',
        title: '住宅自然通风开口面积',
        appliesTo: '住宅套内自然通风、卧室、起居室、明卫生间、厨房及外设阳台的房间。',
        requirement: '每套住宅自然通风开口面积不应小于地面面积的5%；卧室、起居室、明卫生间直接自然通风开口面积不应小于房间地板面积的1/20；厨房直接自然通风开口面积不应小于房间地板面积的1/10，且不得小于0.60㎡。',
        numericValues: ['5%', '1/20', '1/10', '0.60㎡'],
        keywords: ['自然通风', '通风开口', '厨房通风', '明卫生间']
      },
      {
        id: 'residential-noise-level',
        clauseNo: '7.3.1',
        category: '隔声降噪',
        title: '住宅卧室和起居室室内噪声级',
        appliesTo: '住宅卧室、起居室。',
        requirement: '昼间卧室内等效连续A声级不应大于45dB；夜间卧室内不应大于37dB；起居室内不应大于45dB。',
        numericValues: ['45dB', '37dB'],
        keywords: ['噪声级', '卧室', '起居室', '隔声']
      },
      {
        id: 'residential-airborne-sound',
        clauseNo: '7.3.2、7.3.3',
        category: '隔声降噪',
        title: '住宅分户墙楼板隔声',
        appliesTo: '分隔卧室、起居室的分户墙、分户楼板及分隔住宅和非居住用途空间的楼板。',
        requirement: '分隔卧室、起居室的分户墙和分户楼板空气声隔声评价量应大于45dB；分隔住宅和非居住用途空间的楼板空气声隔声评价量应大于51dB；卧室、起居室分户楼板计权规范化撞击声压级宜小于75dB，受限时应小于85dB。',
        numericValues: ['45dB', '51dB', '75dB', '85dB'],
        keywords: ['分户墙', '分户楼板', '空气声隔声', '撞击声']
      },
      {
        id: 'water-pressure',
        clauseNo: '8.2.2、8.2.3',
        category: '给排水',
        title: '住宅供水压力',
        appliesTo: '住宅入户管和套内用水点。',
        requirement: '入户管供水压力不应大于0.35MPa；套内用水点供水压力不宜大于0.20MPa，且不应小于用水器具要求的最低压力。',
        numericValues: ['0.35MPa', '0.20MPa'],
        keywords: ['供水压力', '入户管', '用水点']
      },
      {
        id: 'drainage-water-seal-vent',
        clauseNo: '8.2.10、8.2.13',
        category: '给排水',
        title: '住宅水封和排水通气管高度',
        appliesTo: '住宅地漏、卫生器具存水弯和排水通气管出口。',
        requirement: '存水弯和有水封地漏的水封高度不应小于50mm；排水通气管出口设在上人屋面或住户平台上时应高出屋面或平台地面2.00m，周围4.00m内有门窗时应高出门窗上口0.60m。',
        numericValues: ['50mm', '2.00m', '4.00m', '0.60m'],
        keywords: ['地漏', '水封', '通气管', '上人屋面']
      },
      {
        id: 'gas-pressure-and-room',
        clauseNo: '8.4.1、8.4.3',
        category: '燃气',
        title: '住宅燃气压力和设备房间',
        appliesTo: '住宅管道燃气、燃气灶、燃气热水器等燃气设备。',
        requirement: '住宅管道燃气供气压力不应高于0.2MPa；燃气设备严禁设置在卧室内，直接排气式、半密闭式燃气热水器等不得安装在浴室内，燃气灶和燃气热水器等应安装在通风良好的厨房、阳台或其他非居住房间。',
        numericValues: ['0.2MPa'],
        keywords: ['燃气压力', '燃气设备', '卧室', '浴室', '厨房']
      },
      {
        id: 'electric-load',
        clauseNo: '8.7.1',
        category: '电气',
        title: '每套住宅最小用电负荷',
        appliesTo: '住宅套内用电负荷初步校核。',
        requirement: '每套住宅的用电负荷应根据套内建筑面积和用电负荷计算确定，且不应小于2.5kW。',
        numericValues: ['2.5kW'],
        keywords: ['用电负荷', '住宅电气', '配电']
      }
    ]
  }),

  standard({
    id: 'jgj100-2015',
    title: '车库建筑设计规范',
    code: 'JGJ 100-2015',
    status: '现行行业标准',
    effectiveDate: '2015-12-01',
    category: '车库与停车',
    useCases: ['地下车库', '停车位', '车道', '小型车', '净高'],
    keywords: ['车库', '停车位', '车位尺寸', '小型车', '车道'],
    officialUrls: officialUrls('JGJ 100-2015', [JGJ100_SOURCE]),
    verifiedAt: VERIFIED_AT,
    note: '车库条文与地方停车配建标准、无障碍停车位、消防车道和人防要求经常叠加，应按项目所在地审查口径综合判断。',
    sourceName: '地方自然资源部门公开答复',
    sourceUrl: JGJ100_SOURCE,
    clauses: [
      {
        id: 'small-car-wall',
        clauseNo: '4.3.4',
        category: '停车位',
        title: '小型车垂直式车位邻墙尺寸',
        appliesTo: '地下机动车库小型车停车位，车位毗邻墙体或连续分隔物。',
        requirement: '垂直于通车道的停车位尺寸可按5.30m×2.40m控制。',
        numericValues: ['5.30m', '2.40m'],
        keywords: ['小型车', '停车位', '垂直式', '邻墙']
      },
      {
        id: 'small-car-adjacent',
        clauseNo: '4.3.4',
        category: '停车位',
        title: '小型车相邻车位尺寸',
        appliesTo: '地下机动车库小型车相邻垂直式停车位。',
        requirement: '相邻车位垂直于通车道的停车位尺寸可按5.10m×2.40m控制。',
        numericValues: ['5.10m', '2.40m'],
        keywords: ['小型车', '停车位', '相邻车位']
      },
      {
        id: 'car-design-size',
        clauseNo: '4.3',
        category: '停车位',
        title: '小型车设计车型尺寸',
        appliesTo: '机动车库小型车车位和通道设计。',
        requirement: '小型车设计通常以车长4.80m、车宽1.80m的车辆为基准；大型新能源车应结合地方审查和实际运营适当校核。',
        numericValues: ['4.80m', '1.80m'],
        keywords: ['设计车型', '小型车', '新能源车']
      },
      {
        id: 'parking-width-safety',
        clauseNo: '4.3.4',
        category: '停车位',
        title: '2.40m车位与车宽安全余量',
        appliesTo: '小型车垂直式后退停车。',
        requirement: '2.40m车位宽度以1.80m设计车宽为基准，两侧总余量约0.60m；超宽车辆项目宜在方案阶段加宽或优化车位分组。',
        numericValues: ['2.40m', '1.80m', '0.60m'],
        keywords: ['车位宽度', '停车安全', '余量']
      },
      {
        id: 'garage-fire',
        clauseNo: '2.4',
        category: '消防与车库',
        title: '车库总平面防火设计',
        appliesTo: '机动车库总平面。',
        requirement: '车库总平面防火设计应与现行防火规范协同，尤其核对防火分区、疏散、消防车道和救援条件。',
        numericValues: ['消防协同'],
        keywords: ['车库消防', '防火分区', '消防车道']
      }
    ]
  }),

  standard({
    id: 'gb50034-2013',
    title: '建筑照明设计标准',
    code: 'GB 50034-2013',
    status: '现行国家标准',
    effectiveDate: '2014-06-01',
    category: '照明与环境',
    useCases: ['办公室照度', '住宅照明', '走道楼梯', '卫生间', '车库照明'],
    keywords: ['照度', '照明', '办公室', '住宅', '楼梯', '车库'],
    officialUrls: officialUrls('GB 50034-2013', [GB50034_PDF]),
    verifiedAt: VERIFIED_AT,
    note: '照度应结合工作面高度、眩光、显色指数、功率密度和维护系数综合设计；本页仅列常用初查值。',
    sourceName: 'GB 50034 公开PDF',
    sourceUrl: GB50034_PDF,
    clauses: [
      {
        id: 'office-illuminance',
        clauseNo: '5.3',
        category: '照度',
        title: '普通办公室照度',
        appliesTo: '普通办公室工作面。',
        requirement: '普通办公室照度标准值通常按300lx控制。',
        numericValues: ['300lx'],
        keywords: ['办公室', '照度', '工作面']
      },
      {
        id: 'high-office-illuminance',
        clauseNo: '5.3',
        category: '照度',
        title: '高档办公室照度',
        appliesTo: '高档办公室或视觉作业要求较高的办公空间。',
        requirement: '高档办公室照度标准值通常按500lx控制。',
        numericValues: ['500lx'],
        keywords: ['高档办公室', '照度', '办公']
      },
      {
        id: 'residential-living',
        clauseNo: '5.1',
        category: '住宅照明',
        title: '住宅起居厅一般活动照度',
        appliesTo: '住宅起居厅一般活动。',
        requirement: '起居厅一般活动照度可按100lx初查。',
        numericValues: ['100lx'],
        keywords: ['起居厅', '客厅', '住宅照明']
      },
      {
        id: 'residential-bedroom',
        clauseNo: '5.1',
        category: '住宅照明',
        title: '住宅卧室一般活动照度',
        appliesTo: '住宅卧室一般活动。',
        requirement: '卧室一般活动照度可按75lx初查。',
        numericValues: ['75lx'],
        keywords: ['卧室', '住宅照明', '照度']
      },
      {
        id: 'residential-kitchen',
        clauseNo: '5.1',
        category: '住宅照明',
        title: '住宅厨房照度',
        appliesTo: '住宅厨房一般操作空间。',
        requirement: '厨房一般照度可按100lx初查；操作台局部照明应结合实际任务提高。',
        numericValues: ['100lx'],
        keywords: ['厨房', '照度', '操作台']
      },
      {
        id: 'toilet-illuminance',
        clauseNo: '5.1',
        category: '住宅照明',
        title: '住宅卫生间照度',
        appliesTo: '住宅卫生间一般照明。',
        requirement: '卫生间照度可按100lx初查。',
        numericValues: ['100lx'],
        keywords: ['卫生间', '照度', '住宅照明']
      },
      {
        id: 'stair-illuminance',
        clauseNo: '5.4',
        category: '公共照明',
        title: '楼梯间照度',
        appliesTo: '楼梯间和人员通行空间。',
        requirement: '楼梯间照度可按100lx初查，并应与应急照明和疏散指示协同。',
        numericValues: ['100lx'],
        keywords: ['楼梯间', '照度', '应急照明']
      },
      {
        id: 'garage-illuminance',
        clauseNo: '5.5',
        category: '车库照明',
        title: '地下车库照度',
        appliesTo: '地下停车库停车区和车道。',
        requirement: '地下车库普通照明可按75lx初查，出入口、坡道、收费和识别区域应按功能提高。',
        numericValues: ['75lx'],
        keywords: ['地下车库', '照度', '停车区']
      }
    ]
  }),
  standard({
    id: 'gb55036-2022',
    title: '消防设施通用规范',
    code: 'GB 55036-2022',
    status: '现行强制性工程建设规范',
    effectiveDate: '2023-03-01',
    category: '消防与安全',
    useCases: ['防烟', '排烟', '避难层', '消防联动', '排烟防火阀'],
    keywords: ['消防设施', '防烟', '排烟', '加压送风', '补风', '排烟防火阀'],
    officialUrls: officialUrls('GB 55036-2022', [GB55036_CABR]),
    verifiedAt: VERIFIED_AT,
    note: '用于消防设施系统与建筑方案配合初查；系统设计仍应结合专项消防设计、设备参数和当地消防审查意见。',
    sourceName: 'CABR规范库',
    sourceUrl: GB55036_CABR,
    clauses: [
      {
        id: 'pressurization-independent',
        clauseNo: '11.2.2',
        category: '消防安全',
        title: '加压送风系统独立设置',
        appliesTo: '防烟楼梯间、前室、合用前室、剪刀楼梯间等采用机械加压送风的部位。',
        requirement: '楼梯间、共用前室或合用前室的机械加压送风系统应按规范要求分别独立设置；建筑高度大于100m时，防烟楼梯间及其前室的机械加压送风系统应竖向分段独立设置，每段服务高度不应大于100m。',
        numericValues: ['100m'],
        keywords: ['加压送风', '防烟楼梯间', '合用前室', '服务高度']
      },
      {
        id: 'natural-smoke-front-room',
        clauseNo: '11.2.3',
        category: '消防安全',
        title: '自然通风防烟前室开口面积',
        appliesTo: '采用自然通风方式防烟的防烟楼梯间前室、消防电梯前室、共用前室和合用前室。',
        requirement: '防烟楼梯间前室、消防电梯前室可开启外窗或开口面积应大于或等于2.0㎡；共用前室和合用前室可开启外窗或开口面积应大于或等于3.0㎡。',
        numericValues: ['2.0㎡', '3.0㎡'],
        keywords: ['自然通风', '防烟前室', '消防电梯前室', '开口面积']
      },
      {
        id: 'refuge-natural-smoke',
        clauseNo: '11.2.4',
        category: '消防安全',
        title: '避难区自然通风开口',
        appliesTo: '采用自然通风方式防烟的避难层避难区和避难间。',
        requirement: '避难区应具有不同朝向的可开启外窗或开口，可开启有效面积应大于或等于避难区地面面积的2%，且每个朝向面积均应大于或等于2.0㎡；避难间至少一侧外墙应有可开启外窗，可开启有效面积应大于或等于地面面积的2%，并大于或等于2.0㎡。',
        numericValues: ['2%', '2.0㎡'],
        keywords: ['避难层', '避难间', '自然通风', '开口面积']
      },
      {
        id: 'pressurization-pressure',
        clauseNo: '11.2.5',
        category: '消防安全',
        title: '机械加压送风余压值',
        appliesTo: '机械加压送风系统的前室、合用前室、封闭避难层、封闭楼梯间、防烟楼梯间。',
        requirement: '前室、合用前室、封闭避难层（间）、封闭楼梯间与疏散走道之间压差应为25Pa~30Pa；防烟楼梯间与疏散走道之间压差应为40Pa~50Pa。',
        numericValues: ['25Pa~30Pa', '40Pa~50Pa'],
        keywords: ['余压', '加压送风', '防烟楼梯间', '前室']
      },
      {
        id: 'pressurization-linkage-time',
        clauseNo: '11.2.6',
        category: '消防安全',
        title: '加压送风火灾联动时间',
        appliesTo: '机械加压送风系统与火灾自动报警系统联动。',
        requirement: '机械加压送风系统应与火灾自动报警系统联动，并应能在防火分区火灾信号确认后15s内联动开启相应防烟部位的常闭加压送风口和加压送风机。',
        numericValues: ['15s'],
        keywords: ['消防联动', '加压送风口', '火灾自动报警', '15s']
      },
      {
        id: 'same-smoke-zone-method',
        clauseNo: '11.3.1',
        category: '消防安全',
        title: '同一防烟分区排烟方式',
        appliesTo: '同一个防烟分区内的排烟系统选择。',
        requirement: '同一个防烟分区应采用同一种排烟方式，避免自然排烟和机械排烟混用导致排烟效果受影响。',
        numericValues: ['同一方式'],
        keywords: ['防烟分区', '排烟方式', '自然排烟', '机械排烟']
      },
      {
        id: 'mechanical-smoke-segment',
        clauseNo: '11.3.3',
        category: '消防安全',
        title: '机械排烟系统分区与竖向分段',
        appliesTo: '设置机械排烟系统的公共建筑、工业建筑和住宅建筑。',
        requirement: '机械排烟系统沿水平方向应按不同防火分区独立设置；建筑高度大于50m的公共建筑和工业建筑、建筑高度大于100m的住宅建筑，机械排烟系统应竖向分段独立设置，公共建筑和工业建筑每段服务高度不应大于50m，住宅建筑每段服务高度不应大于100m。',
        numericValues: ['50m', '100m'],
        keywords: ['机械排烟', '防火分区', '竖向分段', '服务高度']
      },
      {
        id: 'smoke-damper-temperature',
        clauseNo: '11.3.5',
        category: '消防安全',
        title: '排烟防火阀关闭温度',
        appliesTo: '穿越防火分区、排烟风机入口、排烟管道穿越防火分隔等部位的排烟防火阀。',
        requirement: '排烟防火阀应具有在280℃时自行关闭并联锁关闭相应排烟风机、补风机的功能。',
        numericValues: ['280℃'],
        keywords: ['排烟防火阀', '排烟风机', '补风机', '280℃']
      },
      {
        id: 'smoke-makeup-air',
        clauseNo: '11.3.6',
        category: '消防安全',
        title: '排烟系统补风',
        appliesTo: '除地上建筑走道或地上建筑面积小于500㎡房间外的设置排烟系统场所。',
        requirement: '设置排烟系统的场所应能直接从室外引入空气补风，补风量和补风口风速应满足排烟系统有效排烟要求；地上建筑走道或地上建筑面积小于500㎡的房间除外。',
        numericValues: ['500㎡'],
        keywords: ['补风', '排烟系统', '补风口', '地上房间']
      }
    ]
  }),
  standard({
    id: 'gb55020-2021',
    title: '建筑给水排水与节水通用规范',
    code: 'GB 55020-2021',
    status: '现行强制性工程建设规范',
    effectiveDate: '2022-04-01',
    category: '给水排水',
    useCases: ['水封', '防回流', '水箱', '排水', '节水', '雨水'],
    keywords: ['给水排水', '水封', '地漏', '防回流', '水箱', '水压', '节水'],
    officialUrls: officialUrls('GB 55020-2021', [GB55020_CABR]),
    verifiedAt: VERIFIED_AT,
    note: '用于建筑给排水与节水强制条文初查；具体管径、流量、水力计算应结合完整标准及专业计算。',
    sourceName: 'CABR规范库',
    sourceUrl: GB55020_CABR,
    clauses: [
      {
        id: 'trap-required',
        clauseNo: '4.2.1',
        category: '给水排水',
        title: '排水口接入生活排水管道需设存水弯',
        appliesTo: '构造内无存水弯的卫生器具、无水封地漏、设备或排水沟排水口。',
        requirement: '当上述排水口与生活排水管道连接时，必须在排水口以下设置存水弯。',
        numericValues: ['存水弯'],
        keywords: ['存水弯', '地漏', '卫生器具', '排水口']
      },
      {
        id: 'trap-depth',
        clauseNo: '4.2.2',
        category: '给水排水',
        title: '水封深度',
        appliesTo: '卫生器具、地漏、排水沟等水封装置。',
        requirement: '水封装置的水封深度不得小于50mm，卫生器具排水管段上不得重复设置水封。',
        numericValues: ['50mm'],
        keywords: ['水封', '水封深度', '存水弯', '50mm']
      },
      {
        id: 'floor-drain-ban',
        clauseNo: '4.2.3',
        category: '给水排水',
        title: '禁用钟罩式地漏',
        appliesTo: '室内排水地漏和水封替代做法。',
        requirement: '严禁采用钟罩式结构地漏，严禁采用活动机械活瓣替代水封。',
        numericValues: ['严禁'],
        keywords: ['钟罩式地漏', '机械活瓣', '水封', '地漏']
      },
      {
        id: 'indoor-ditch-trap',
        clauseNo: '4.2.4',
        category: '给水排水',
        title: '室内排水沟接室外污水管需水封',
        appliesTo: '室内生活废水排水沟与室外生活污水管道连接处。',
        requirement: '室内生活废水排水沟与室外生活污水管道连接处应设置水封装置。',
        numericValues: ['水封装置'],
        keywords: ['排水沟', '污水管', '水封']
      },
      {
        id: 'drainage-no-odor',
        clauseNo: '4.3.2',
        category: '给水排水',
        title: '生活排水不得向室内散发有害气体',
        appliesTo: '室内生活排水系统。',
        requirement: '室内生活排水系统不得向室内散发浊气或臭气等有害气体。',
        numericValues: ['不得散发'],
        keywords: ['排水', '臭气', '浊气', '室内环境']
      },
      {
        id: 'drainage-vent-pipe',
        clauseNo: '4.3.4',
        category: '给水排水',
        title: '通气管不得接纳污废水',
        appliesTo: '生活排水系统通气管道。',
        requirement: '通气管道不得接纳器具污水、废水，不得与风道和烟道连接。',
        numericValues: ['不得连接风道烟道'],
        keywords: ['通气管', '排水', '风道', '烟道']
      },
      {
        id: 'shower-washer-floor-drain',
        clauseNo: '4.3.5',
        category: '给水排水',
        title: '淋浴和洗衣机部位地面排水',
        appliesTo: '设有淋浴器和洗衣机的部位。',
        requirement: '设有淋浴器和洗衣机的部位应设置地面排水设施。',
        numericValues: ['地面排水'],
        keywords: ['淋浴', '洗衣机', '地漏', '地面排水']
      },
      {
        id: 'basement-pressure-drainage',
        clauseNo: '4.3.7',
        category: '给水排水',
        title: '地下室卫生器具压力排水',
        appliesTo: '地下室、半地下室中的卫生器具和地漏。',
        requirement: '地下室、半地下室中的卫生器具和地漏不得与上部排水管道连接，应采用压力流排水系统，并应保证污水、废水安全可靠排出。',
        numericValues: ['压力流排水'],
        keywords: ['地下室', '半地下室', '压力排水', '地漏']
      },
      {
        id: 'drinking-water-pool-distance',
        clauseNo: '3.3.1',
        category: '给水排水',
        title: '生活饮用水池周边污染源控制',
        appliesTo: '埋地式生活饮用水贮水池、生活饮用水水池（箱）。',
        requirement: '埋地式生活饮用水贮水池周围10m内不得有化粪池、污水处理构筑物、渗水井、垃圾堆放点等污染源；生活饮用水水池（箱）周围2m内不得有污水管和污染物。',
        numericValues: ['10m', '2m'],
        keywords: ['生活饮用水', '水池', '污染源', '化粪池']
      },
      {
        id: 'backup-water-pump',
        clauseNo: '3.3.2',
        category: '给水排水',
        title: '生活给水系统备用泵',
        appliesTo: '生活给水系统水泵机组。',
        requirement: '生活给水系统水泵机组应设备用泵，备用泵供水能力不应小于最大一台运行水泵的供水能力。',
        numericValues: ['备用泵'],
        keywords: ['水泵', '备用泵', '供水能力', '给水泵房']
      },
      {
        id: 'water-pressure-reduction',
        clauseNo: '3.4.4',
        category: '给水排水',
        title: '用水点超压减压',
        appliesTo: '用水点处水压较高的配水支管。',
        requirement: '用水点处水压大于0.2MPa的配水支管应采取减压措施，并应满足用水器具工作压力要求。',
        numericValues: ['0.2MPa'],
        keywords: ['水压', '减压', '配水支管', '节水']
      },
      {
        id: 'public-basin-faucet',
        clauseNo: '3.4.5',
        category: '给水排水',
        title: '公共场所洗手盆水嘴',
        appliesTo: '公共场所卫生间洗手盆。',
        requirement: '公共场所的洗手盆水嘴应采用非接触式或延时自闭式水嘴。',
        numericValues: ['非接触式', '延时自闭式'],
        keywords: ['公共卫生间', '洗手盆', '水嘴', '节水']
      },
      {
        id: 'outdoor-landscape-water',
        clauseNo: '3.4.3',
        category: '给水排水',
        title: '非亲水景观水体水源',
        appliesTo: '非亲水性的室外景观水体补水。',
        requirement: '非亲水性的室外景观水体用水水源不得采用市政自来水和地下井水。',
        numericValues: ['不得采用自来水', '不得采用地下井水'],
        keywords: ['景观水体', '节水', '再生水', '雨水']
      }
    ]
  }),
  standard({
    id: 'gb55015-2021',
    title: '建筑节能与可再生能源利用通用规范',
    code: 'GB 55015-2021',
    status: '现行强制性工程建设规范',
    effectiveDate: '2022-04-01',
    category: '绿色节能',
    useCases: ['窗墙比', '自然通风', '遮阳', '采光', '电梯节能', '可再生能源'],
    keywords: ['节能', '窗墙比', '体形系数', '通风开口', '遮阳', '可见光透射比'],
    officialUrls: officialUrls('GB 55015-2021', [GB55015_CABR]),
    verifiedAt: VERIFIED_AT,
    note: '用于节能强制性底线初查；围护结构热工性能和权衡判断应按完整标准表格及专业计算执行。',
    sourceName: 'CABR规范库',
    sourceUrl: GB55015_CABR,
    clauses: [
      {
        id: 'public-roof-skylight-ratio',
        clauseNo: '3.1.6',
        category: '采光环境',
        title: '甲类公共建筑屋面透光面积比例',
        appliesTo: '甲类公共建筑屋面透光部分。',
        requirement: '甲类公共建筑的屋面透光部分面积不应大于屋面总面积的20%。',
        numericValues: ['20%'],
        keywords: ['屋面透光', '天窗', '公共建筑', '节能']
      },
      {
        id: 'industrial-window-roof-ratio',
        clauseNo: '3.1.7',
        category: '采光环境',
        title: '设置供暖空调工业建筑窗墙比',
        appliesTo: '设置供暖、空调系统的工业建筑。',
        requirement: '设置供暖、空调系统的工业建筑总窗墙面积比不应大于0.50，屋顶透光部分面积不应大于屋顶总面积的15%。',
        numericValues: ['0.50', '15%'],
        keywords: ['工业建筑', '窗墙比', '屋顶透光', '节能']
      },
      {
        id: 'lobby-full-glass-curtain',
        clauseNo: '3.1.13',
        category: '采光环境',
        title: '入口大堂全玻幕墙非中空玻璃比例',
        appliesTo: '公共建筑入口大堂采用全玻幕墙时。',
        requirement: '全玻幕墙中非中空玻璃面积不应超过该建筑同一立面透光面积的15%，且应按同一立面透光面积加权计算平均传热系数。',
        numericValues: ['15%'],
        keywords: ['全玻幕墙', '非中空玻璃', '入口大堂', '传热系数']
      },
      {
        id: 'residential-vent-opening-warm',
        clauseNo: '3.1.14',
        category: '采光环境',
        title: '居住建筑外窗通风开口面积',
        appliesTo: '夏热冬暖、温和B区、夏热冬冷、温和A区居住建筑外窗。',
        requirement: '夏热冬暖、温和B区居住建筑外窗通风开口面积不应小于房间地面面积的10%或外窗面积的45%；夏热冬冷、温和A区居住建筑外窗通风开口面积不应小于房间地面面积的5%。',
        numericValues: ['10%', '45%', '5%'],
        keywords: ['通风开口', '外窗', '居住建筑', '自然通风']
      },
      {
        id: 'public-openable-window',
        clauseNo: '3.1.14',
        category: '采光环境',
        title: '公共建筑主要功能房间可开启窗',
        appliesTo: '公共建筑中主要功能房间外窗及透光幕墙。',
        requirement: '公共建筑中主要功能房间的外窗（包括透光幕墙）应设置可开启窗扇或通风换气装置。',
        numericValues: ['可开启窗扇'],
        keywords: ['公共建筑', '可开启窗', '通风换气', '外窗']
      },
      {
        id: 'public-building-shading',
        clauseNo: '3.1.15',
        category: '采光环境',
        title: '夏热地区公共建筑遮阳',
        appliesTo: '夏热冬暖、夏热冬冷地区甲类公共建筑南、东、西向外窗和透光幕墙。',
        requirement: '夏热冬暖、夏热冬冷地区，甲类公共建筑南、东、西向外窗和透光幕墙应采取遮阳措施。',
        numericValues: ['南向', '东向', '西向'],
        keywords: ['遮阳', '公共建筑', '透光幕墙', '夏热冬暖']
      },
      {
        id: 'residential-east-west-shading',
        clauseNo: '3.1.15',
        category: '采光环境',
        title: '夏热冬暖地区住宅东西向遮阳系数',
        appliesTo: '夏热冬暖地区居住建筑东、西向外窗。',
        requirement: '夏热冬暖地区，居住建筑东、西向外窗的建筑遮阳系数不应大于0.8。',
        numericValues: ['0.8'],
        keywords: ['遮阳系数', '东西向外窗', '居住建筑', '夏热冬暖']
      },
      {
        id: 'residential-window-air-leakage',
        clauseNo: '3.1.16',
        category: '采光环境',
        title: '居住建筑外窗空气渗透量',
        appliesTo: '居住建筑幕墙、外窗及敞开阳台的门。',
        requirement: '在10Pa压差下，每小时每米缝隙空气渗透量q1不应大于1.5m³，每小时每平方米面积空气渗透量q2不应大于4.5m³。',
        numericValues: ['10Pa', '1.5m³', '4.5m³'],
        keywords: ['空气渗透量', '外窗', '幕墙', '阳台门']
      },
      {
        id: 'residential-glass-vlt',
        clauseNo: '3.1.17',
        category: '采光环境',
        title: '居住建筑外窗玻璃可见光透射比',
        appliesTo: '居住建筑外窗玻璃。',
        requirement: '居住建筑外窗玻璃的可见光透射比不应小于0.40。',
        numericValues: ['0.40'],
        keywords: ['可见光透射比', '外窗玻璃', '采光']
      },
      {
        id: 'residential-window-floor-ratio',
        clauseNo: '3.1.18',
        category: '采光环境',
        title: '居住建筑主要房间窗地面积比',
        appliesTo: '居住建筑卧室、书房、起居室等主要使用房间。',
        requirement: '主要使用房间的房间窗地面积比不应小于1/7。',
        numericValues: ['1/7'],
        keywords: ['窗地面积比', '卧室', '起居室', '书房']
      },
      {
        id: 'elevator-energy-saving',
        clauseNo: '3.1.20',
        category: '设备管线',
        title: '电梯与自动扶梯节能运行',
        appliesTo: '电梯、自动扶梯、自动人行步道。',
        requirement: '电梯应具备节能运行功能；两台及以上电梯集中排列时应设置群控措施；自动扶梯、自动人行步道应具备空载暂停或低速运转功能。',
        numericValues: ['两台及以上', '空载暂停', '低速运转'],
        keywords: ['电梯', '群控', '自动扶梯', '节能运行']
      }
    ]
  }),
  standard({
    id: 'gb50067-2014',
    title: '汽车库、修车库、停车场设计防火规范',
    code: 'GB 50067-2014',
    status: '现行国家标准',
    effectiveDate: '2015-08-01',
    category: '车库与停车',
    useCases: ['汽车库', '停车场', '消防车道', '防火分区', '排烟', '防火间距'],
    keywords: ['汽车库', '停车场', '修车库', '防火间距', '消防车道', '排烟'],
    officialUrls: officialUrls('GB 50067-2014', [GB50067_CABR]),
    verifiedAt: VERIFIED_AT,
    note: '用于车库、修车库和停车场防火初查；地下车库还需同步核对建筑防火通用规范、消防设施通用规范和地方消防审查口径。',
    sourceName: 'CABR规范库',
    sourceUrl: GB50067_CABR,
    clauses: [
      {
        id: 'parking-group-fire-spacing',
        clauseNo: '4.2.10',
        category: '消防安全',
        title: '停车场分组停放与组间距',
        appliesTo: '露天停车场汽车分组停放。',
        requirement: '停车场汽车宜分组停放，每组停车数量不宜大于50辆，组之间防火间距不应小于6m。',
        numericValues: ['50辆', '6m'],
        keywords: ['停车场', '分组停放', '防火间距', '50辆']
      },
      {
        id: 'hazard-vehicle-fire-spacing',
        clauseNo: '4.2.5',
        category: '消防安全',
        title: '甲乙类物品运输车库防火间距',
        appliesTo: '甲、乙类物品运输车的汽车库、修车库、停车场。',
        requirement: '与民用建筑防火间距不应小于25m，与重要公共建筑防火间距不应小于50m；甲类物品运输车库与明火或散发火花地点防火间距不应小于30m。',
        numericValues: ['25m', '50m', '30m'],
        keywords: ['甲乙类物品', '运输车', '民用建筑', '重要公共建筑']
      },
      {
        id: 'garage-fire-lane',
        clauseNo: '4.3.2',
        category: '消防安全',
        title: '汽车库消防车道设置',
        appliesTo: '汽车库、修车库周边消防车道。',
        requirement: '除Ⅳ类汽车库和修车库外，消防车道应为环形；设置环形车道困难时，可沿建筑物一个长边和另一边设置。尽头式消防车道应设回车道或回车场，回车场面积不应小于12m×12m；消防车道宽度不应小于4m。',
        numericValues: ['12m×12m', '4m'],
        keywords: ['消防车道', '回车场', '环形车道', '汽车库']
      },
      {
        id: 'garage-fire-lane-clearance',
        clauseNo: '4.3.3',
        category: '消防安全',
        title: '穿过车库消防车道净空',
        appliesTo: '穿过汽车库、修车库、停车场的消防车道。',
        requirement: '穿过汽车库、修车库、停车场的消防车道净空高度和净宽度均不应小于4m；上空遇障碍物时，路面与障碍物之间净空高度不应小于4m。',
        numericValues: ['4m'],
        keywords: ['消防车道', '净空高度', '净宽度', '车库']
      },
      {
        id: 'garage-sprinkler-fire-compartment',
        clauseNo: '5.1.2',
        category: '消防安全',
        title: '设自动灭火系统的汽车库防火分区面积',
        appliesTo: '设置自动灭火系统的汽车库。',
        requirement: '设置自动灭火系统的汽车库，每个防火分区最大允许建筑面积不应大于规范第5.1.1条规定的2.0倍。',
        numericValues: ['2.0倍'],
        keywords: ['自动灭火系统', '防火分区', '汽车库']
      },
      {
        id: 'hazard-vehicle-fire-compartment',
        clauseNo: '5.1.4',
        category: '消防安全',
        title: '甲乙类物品运输车库防火分区面积',
        appliesTo: '甲、乙类物品运输车的汽车库、修车库。',
        requirement: '甲、乙类物品运输车的汽车库、修车库，每个防火分区最大允许建筑面积不应大于500㎡。',
        numericValues: ['500㎡'],
        keywords: ['甲乙类物品', '防火分区', '汽车库', '修车库']
      },
      {
        id: 'repair-garage-fire-compartment',
        clauseNo: '5.1.5',
        category: '消防安全',
        title: '修车库防火分区面积',
        appliesTo: '修车库及使用有机溶剂清洗、喷漆的修车工段。',
        requirement: '修车库每个防火分区最大允许建筑面积不应大于2000㎡；当修车部位与相邻使用有机溶剂的清洗和喷漆工段采用防火墙分隔时，每个防火分区最大允许建筑面积不应大于4000㎡。',
        numericValues: ['2000㎡', '4000㎡'],
        keywords: ['修车库', '防火分区', '喷漆', '有机溶剂']
      },
      {
        id: 'garage-other-building-separation',
        clauseNo: '5.1.6',
        category: '消防安全',
        title: '汽车库与其他建筑合建分隔',
        appliesTo: '汽车库、修车库与其他建筑贴邻或设在建筑内的情况。',
        requirement: '贴邻建造时应采用防火墙隔开；设在建筑物内时，与其他部位之间应采用防火墙和耐火极限不低于2.00h的不燃性楼板分隔；外墙门洞口上方防火挑檐耐火极限不低于1.00h、宽度不小于1.0m。',
        numericValues: ['2.00h', '1.00h', '1.0m'],
        keywords: ['合建', '防火墙', '防火挑檐', '不燃性楼板']
      },
      {
        id: 'garage-smoke-zone',
        clauseNo: '8.2.2',
        category: '消防安全',
        title: '汽车库防烟分区面积',
        appliesTo: '汽车库、修车库排烟系统防烟分区。',
        requirement: '防烟分区建筑面积不宜大于2000㎡，且防烟分区不应跨越防火分区；可采用挡烟垂壁、隔墙或从顶棚下突出不小于0.5m的梁划分。',
        numericValues: ['2000㎡', '0.5m'],
        keywords: ['防烟分区', '排烟', '挡烟垂壁', '汽车库']
      },
      {
        id: 'garage-natural-smoke-opening',
        clauseNo: '8.2.4',
        category: '消防安全',
        title: '汽车库自然排烟口面积',
        appliesTo: '汽车库、修车库采用自然排烟方式时。',
        requirement: '自然排烟口总面积不应小于室内地面面积的2%；排烟口应设在外墙上方或屋顶，并设置方便开启装置；外墙排烟口下沿不应低于室内净高的1/2。',
        numericValues: ['2%', '1/2'],
        keywords: ['自然排烟', '排烟口', '汽车库', '室内净高']
      },
      {
        id: 'garage-smoke-port-distance',
        clauseNo: '8.2.6',
        category: '消防安全',
        title: '汽车库排烟口最远点距离',
        appliesTo: '汽车库、修车库每个防烟分区排烟口布置。',
        requirement: '每个防烟分区应设置排烟口，排烟口宜设在顶棚或靠近顶棚的墙面上；排烟口距该防烟分区内最远点水平距离不应大于30m。',
        numericValues: ['30m'],
        keywords: ['排烟口', '防烟分区', '最远点', '汽车库']
      },
      {
        id: 'garage-smoke-fan-temperature',
        clauseNo: '8.2.7',
        category: '消防安全',
        title: '汽车库排烟风机耐温',
        appliesTo: '汽车库、修车库机械排烟风机。',
        requirement: '排烟风机应保证280℃时能连续工作30min。',
        numericValues: ['280℃', '30min'],
        keywords: ['排烟风机', '耐温', '机械排烟', '汽车库']
      },
      {
        id: 'garage-smoke-duct-speed',
        clauseNo: '8.2.9',
        category: '消防安全',
        title: '汽车库机械排烟风速',
        appliesTo: '汽车库机械排烟管道和排烟口。',
        requirement: '机械排烟管道采用金属管道时风速不应大于20m/s；采用内表面光滑的非金属材料风道时不应大于15m/s；排烟口风速不宜大于10m/s。',
        numericValues: ['20m/s', '15m/s', '10m/s'],
        keywords: ['排烟管道', '风速', '金属管道', '排烟口']
      },
      {
        id: 'garage-smoke-makeup-air',
        clauseNo: '8.2.10',
        category: '消防安全',
        title: '无直通室外出口车库补风',
        appliesTo: '无直接通向室外汽车疏散出口的防火分区，且设置机械排烟系统的汽车库。',
        requirement: '应同时设置补风系统，且补风量不宜小于排烟量的50%。',
        numericValues: ['50%'],
        keywords: ['补风', '机械排烟', '汽车疏散出口', '防火分区']
      }
    ]
  }),
  standard({
    id: 'gb50015-2019',
    title: '建筑给水排水设计标准',
    code: 'GB 50015-2019',
    status: '现行国家标准',
    effectiveDate: '2020-03-01',
    category: '给水排水',
    useCases: ['建筑给水', '生活排水', '雨水排水', '直饮水', '节水设计'],
    keywords: ['给水', '排水', '水封', '地漏', '雨水', '水箱', '直饮水', '冷却塔'],
    officialUrls: officialUrls('GB 50015-2019', [GB50015_CABR]),
    verifiedAt: VERIFIED_AT,
    note: '用于建筑给水排水方案与施工图阶段常用条文速查；设备选型和水力计算仍应结合完整标准、产品参数及专项设计。',
    sourceName: 'CABR规范库',
    sourceUrl: GB50015_CABR,
    clauses: [
      {
        id: 'separate-self-water-source',
        clauseNo: '3.1.2',
        category: '给水排水',
        title: '自备水源不得直连城镇给水',
        appliesTo: '工程基地内存在自备水源或自建设施供水系统，并同时接入城镇给水管网时。',
        requirement: '自备水源的供水管道严禁与城镇给水管道直接连接；需要补水时，应通过贮水设施和有效空气间隙间接补入。',
        numericValues: ['严禁直连'],
        keywords: ['自备水源', '城镇给水', '直连', '空气间隙']
      },
      {
        id: 'reclaimed-water-no-drinking-connection',
        clauseNo: '3.1.3',
        category: '给水排水',
        title: '中水和回用雨水不得接生活饮用水',
        appliesTo: '中水、回用雨水等非生活饮用水系统与生活饮用水系统并存的建筑或小区。',
        requirement: '中水、回用雨水等非生活饮用水管道严禁与生活饮用水管道连接；生活饮用水作为补充水时，应补入贮存池并设置符合要求的空气间隙。',
        numericValues: ['严禁连接'],
        keywords: ['中水', '回用雨水', '生活饮用水', '空气间隙']
      },
      {
        id: 'drinking-water-backflow-protection',
        clauseNo: '3.1.4',
        category: '给水排水',
        title: '生活饮用水防回流污染',
        appliesTo: '生活饮用水给水系统与可能产生虹吸回流、背压回流风险的用水点或设备连接处。',
        requirement: '生活饮用水系统应设置防止管道内产生虹吸回流、背压回流等污染的措施，防止已污染水体倒流进入饮用水管网。',
        numericValues: ['防回流'],
        keywords: ['防回流', '虹吸回流', '背压回流', '生活饮用水']
      },
      {
        id: 'green-irrigation-water-quota',
        clauseNo: '3.2.3',
        category: '场地交通',
        title: '小区绿化浇灌用水定额',
        appliesTo: '居住小区、公建区或工业园区绿化浇灌用水量估算。',
        requirement: '绿化浇灌用水定额应结合气候、植物、土壤、浇灌方式和管理制度确定；无资料时，小区绿化浇灌最高日用水定额可按浇灌面积1.0L/(㎡·d)～3.0L/(㎡·d)计算，干旱地区可酌情增加。',
        numericValues: ['1.0L/(㎡·d)', '3.0L/(㎡·d)'],
        keywords: ['绿化', '浇灌', '用水定额', '场地']
      },
      {
        id: 'road-square-sprinkling-water-quota',
        clauseNo: '3.2.4',
        category: '场地交通',
        title: '道路广场浇洒用水定额',
        appliesTo: '小区道路、广场等室外硬质场地浇洒用水量估算。',
        requirement: '小区道路、广场的浇洒最高日用水定额可按浇洒面积2.0L/(㎡·d)～3.0L/(㎡·d)计算。',
        numericValues: ['2.0L/(㎡·d)', '3.0L/(㎡·d)'],
        keywords: ['道路', '广场', '浇洒', '用水定额']
      },
      {
        id: 'water-loss-unforeseen-rate',
        clauseNo: '3.2.9',
        category: '给水排水',
        title: '给水管网漏失和未预见水量',
        appliesTo: '建筑小区或建筑群给水系统总用水量估算。',
        requirement: '给水管网漏失水量和未预见水量应计算确定；缺少资料时，两者之和可按最高日用水量的8%～12%计。',
        numericValues: ['8%', '12%'],
        keywords: ['漏失水量', '未预见水量', '最高日用水量']
      },
      {
        id: 'public-toilet-water-saving-fixtures',
        clauseNo: '3.2.14',
        category: '卫生间',
        title: '公共卫生间节水器具',
        appliesTo: '办公、商业、文化、交通等公共场所卫生间。',
        requirement: '公共卫生间洗手盆应采用感应式水嘴或延时自闭式水嘴等限流节水装置；小便器应采用感应式或延时自闭式冲洗阀；蹲式大便器应采用感应式或延时自闭式冲洗阀等。',
        numericValues: ['感应式', '延时自闭'],
        keywords: ['公共卫生间', '感应水嘴', '延时自闭', '节水']
      },
      {
        id: 'fixture-air-gap',
        clauseNo: '3.3.4',
        category: '给水排水',
        title: '配水件出水口空气间隙',
        appliesTo: '卫生器具和用水设备的生活饮用水管配水件出水口。',
        requirement: '出水口不得被任何液体或杂质淹没；出水口高出承接用水容器溢流边缘的最小空气间隙不得小于出水口直径的2.5倍。',
        numericValues: ['2.5倍'],
        keywords: ['空气间隙', '出水口', '溢流边缘', '防回流']
      },
      {
        id: 'drinking-water-tank-inlet-gap',
        clauseNo: '3.3.5',
        category: '给水排水',
        title: '生活饮用水池箱进水空气间隙',
        appliesTo: '生活饮用水水池、水箱的进水管口。',
        requirement: '进水管口最低点高出溢流边缘的空气间隙不应小于进水管管径，且不应小于25mm，可不大于150mm；最高水位以上淹没出流时应采取真空破坏器等防虹吸回流措施。',
        numericValues: ['25mm', '150mm'],
        keywords: ['水池', '水箱', '进水管', '空气间隙']
      },
      {
        id: 'non-drinking-tank-makeup-gap',
        clauseNo: '3.3.6',
        category: '给水排水',
        title: '非饮用水池箱补水空气间隙',
        appliesTo: '生活饮用水管网向消防、中水、雨水回用等非生活饮用水贮水池箱补水。',
        requirement: '向消防等非供生活饮用水贮水池箱补水时，进水管口最低点高出溢流边缘的空气间隙不应小于150mm；向中水、雨水回用水系统补水时，不应小于进水管径的2.5倍，且不应小于150mm。',
        numericValues: ['150mm', '2.5倍'],
        keywords: ['消防水池', '中水', '雨水回用', '空气间隙']
      },
      {
        id: 'direct-supply-backflow-preventer',
        clauseNo: '3.3.7',
        category: '给水排水',
        title: '直接供水管道倒流防止器',
        appliesTo: '城镇给水管网多路引入、直接抽水加压、向有压容器或密闭容器注水等连接。',
        requirement: '从生活饮用水管道直接供给可能产生背压回流的用水管道时，应在相应引入管、加压设备进水管或容器注水管上设置倒流防止器。',
        numericValues: ['倒流防止器'],
        keywords: ['倒流防止器', '引入管', '加压设备', '有压容器']
      },
      {
        id: 'toxic-equipment-backflow-protection',
        clauseNo: '3.3.9',
        category: '给水排水',
        title: '有毒有害场所防倒流',
        appliesTo: '生活饮用水管道连接含有有毒有害物质的贮存池、设备、化工区域或生物安全实验室。',
        requirement: '生活饮用水管道连接含有有毒有害物质的场所或设备时，必须设置倒流防止设施；三级及以上生物安全实验室还应在防护区外设置有空气间隙的水箱。',
        numericValues: ['三级'],
        keywords: ['有毒有害', '生物安全实验室', '倒流防止', '空气间隙']
      },
      {
        id: 'non-drinking-faucet-warning',
        clauseNo: '3.3.21',
        category: '给水排水',
        title: '非饮用水取水点防误用',
        appliesTo: '中水、回用雨水、杂用水等非饮用水管道上的水嘴或取水短管。',
        requirement: '在非饮用水管道上安装水嘴或取水短管时，应采取防止误饮误用的措施。',
        numericValues: ['防误饮'],
        keywords: ['非饮用水', '取水短管', '防误饮', '标识']
      },
      {
        id: 'direct-drinking-water-pressure',
        clauseNo: '6.9.3',
        category: '给水排水',
        title: '管道直饮水水嘴与压力',
        appliesTo: '住宅、办公、学校等设置管道直饮水系统的建筑。',
        requirement: '管道直饮水水嘴额定流量宜为0.04L/s～0.06L/s，最低工作压力不应小于0.03MPa；系统必须独立设置。',
        numericValues: ['0.04L/s', '0.06L/s', '0.03MPa'],
        keywords: ['管道直饮水', '水嘴', '工作压力', '独立系统']
      },
      {
        id: 'direct-drinking-water-zoning',
        clauseNo: '6.9.3',
        category: '给水排水',
        title: '高层直饮水竖向分区',
        appliesTo: '高层建筑管道直饮水系统。',
        requirement: '高层建筑管道直饮水系统应竖向分区；各分区最低处配水点静水压，住宅不宜大于0.35MPa，公共建筑不宜大于0.40MPa，最不利配水点水压应满足用水要求。',
        numericValues: ['0.35MPa', '0.40MPa'],
        keywords: ['直饮水', '竖向分区', '静水压', '高层建筑']
      },
      {
        id: 'direct-drinking-water-loop',
        clauseNo: '6.9.3',
        category: '给水排水',
        title: '直饮水循环与支管长度',
        appliesTo: '管道直饮水供回水管网及配水龙头支管。',
        requirement: '管道直饮水应设循环管道，供回水管网应同程布置；循环管网内水停留时间不应超过12h，从立管接至配水龙头的支管长度不宜大于3m。',
        numericValues: ['12h', '3m'],
        keywords: ['直饮水', '循环管道', '停留时间', '支管长度']
      },
      {
        id: 'school-drinking-fountain',
        clauseNo: '6.9.5',
        category: '给水排水',
        title: '学校体育建筑饮水器',
        appliesTo: '中小学校、体育场馆等公共建筑设置饮水器时。',
        requirement: '以温水或自来水为原水的直饮水应过滤和消毒；应设循环管道且循环回水经消毒处理；饮水器喷嘴应倾斜安装并设防护装置，喷嘴孔高度应保证排水管堵塞时不被淹没。',
        numericValues: ['过滤消毒', '循环回水'],
        keywords: ['饮水器', '学校', '体育场馆', '循环消毒']
      },
      {
        id: 'drinking-water-room-drain',
        clauseNo: '6.9.10',
        category: '给水排水',
        title: '开水间和饮水处理间排水',
        appliesTo: '公共建筑开水间、饮水处理间。',
        requirement: '开水间、饮水处理间应设给水管、排污排水用地漏；开水器、开水炉排污和排水管道应采用金属排水管或耐热塑料排水管。',
        numericValues: ['地漏', '耐热排水管'],
        keywords: ['开水间', '饮水处理间', '地漏', '耐热排水管']
      },
      {
        id: 'cooling-tower-layout-distance',
        clauseNo: '3.11.6',
        category: '设备管线',
        title: '冷却塔布置与进风距离',
        appliesTo: '建筑空调循环冷却水系统冷却塔布置。',
        requirement: '冷却塔宜单排布置；多排布置时塔排间距离应保证进风量，且不宜小于冷却塔进风口高度的4倍；冷却塔进风侧与建筑物距离宜大于冷却塔进风口高度的2倍。',
        numericValues: ['4倍', '2倍'],
        keywords: ['冷却塔', '进风', '布置距离', '空调']
      },
      {
        id: 'cooling-tower-sump-submergence',
        clauseNo: '3.11.12',
        category: '设备管线',
        title: '冷却塔集水池最小淹没深度',
        appliesTo: '循环冷却水系统设置冷却塔集水池时。',
        requirement: '集水池容积应满足布水装置、填料附着水量、停泵重力回流水量和水泵吸水口最小淹没深度；吸水管流速≤0.6m/s时最小淹没深度不应小于0.3m，流速为1.2m/s时不应小于0.6m。',
        numericValues: ['0.6m/s', '0.3m', '1.2m/s', '0.6m'],
        keywords: ['冷却塔', '集水池', '淹没深度', '吸水管']
      },
      {
        id: 'cooling-tower-makeup-water',
        clauseNo: '3.11.14',
        category: '设备管线',
        title: '冷却塔补充水量',
        appliesTo: '建筑空调、冷冻设备循环冷却水系统补充水量估算。',
        requirement: '建筑物空调、冷冻设备的补充水量可按冷却水循环水量的1%～2%确定；设计浓缩倍数不宜小于3.0。',
        numericValues: ['1%', '2%', '3.0'],
        keywords: ['冷却塔', '补充水量', '循环水量', '浓缩倍数']
      },
      {
        id: 'cooling-water-side-stream',
        clauseNo: '3.11.17',
        category: '设备管线',
        title: '循环冷却水旁流处理量',
        appliesTo: '循环冷却水系统采用过滤旁流处理去除悬浮物时。',
        requirement: '旁流处理水量应根据去除对象计算；采用过滤处理去除悬浮物时，过滤水量宜为冷却水循环水量的1%～5%。',
        numericValues: ['1%', '5%'],
        keywords: ['旁流处理', '过滤', '循环冷却水', '悬浮物']
      },
      {
        id: 'cooling-water-drainage',
        clauseNo: '3.11.18',
        category: '设备管线',
        title: '循环冷却水排水去向',
        appliesTo: '循环冷却水系统排污、放空、清洗、旁流处理等排水。',
        requirement: '循环冷却水系统排水应排入室外污水管道，不应直接排入市政雨水系统。',
        numericValues: ['室外污水管道'],
        keywords: ['循环冷却水', '排水', '污水管道', '雨水管道']
      }
    ]
  })
];
