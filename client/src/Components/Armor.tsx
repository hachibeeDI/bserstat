import React, { useEffect, useState } from 'react';
import 'antd/dist/antd.css';
import '../index.css';
import axios from "axios";
import { t } from "../Translate/translate";
import RankTable from "./RankTable";
import { stringSort, valueRender } from "./Common";


interface Row {
  armorTypeName: string;
  armorName: string;
  soloWinRate: number;
  soloPickRate: number;
  duoWinRate: number;
  duoPickRate: number;
  squadWinRate: number;
  squadPickRate: number;
}

function makeData(data: any): Row[] {
  let result: Row[] = []
  if (data.TypeList.length === 0) {
    return result
  }

  function extracted(armorType: any, armor: any) {
    let d: Row = {
      armorTypeName: armorType.Name,
      armorName: armor.Name,
      soloWinRate: 0,
      soloPickRate: 0,
      duoWinRate: 0,
      duoPickRate: 0,
      squadWinRate: 0,
      squadPickRate: 0,
    }
    armor.ModeList.forEach((mode: any) => {
      // console.log(mode)
      if (mode.Mode === "Solo") {
        d.soloWinRate = (mode.WinRate)
        d.soloPickRate = (mode.PickRate)
      }
      if (mode.Mode === "Duo") {
        d.duoWinRate = (mode.WinRate)
        d.duoPickRate = (mode.PickRate)
      }
      if (mode.Mode === "Squad") {
        d.squadWinRate = (mode.WinRate)
        d.squadPickRate = (mode.PickRate)
      }
    })
    return d;
  }

  let d = extracted({Name: "Base Win Rate"}, {ModeList: data.BaseWinRate});
  result.push(d)

  data.TypeList.forEach((armorType: any) => {
    // console.log(chara)
    if (armorType.ArmorList === null) {
      return
    }
    armorType.ArmorList.forEach((amor: any) => {

      let d = extracted(armorType, amor);
      result.push(d)

    })
  })
  return result
}

interface UserProp {
  tier: string
  updated: string
  period: string
  label: string
  before: string
  lang: string
}

function Armor(prop: UserProp) {
  const [json, setJson] = useState({TypeList: []});
  const [beforeJson, setBeforeJson] = useState({TypeList: []});

  function fetchUserRankJson(tier: string, label: string, isBefore = false) {
    if (label === "") {
      return
    }
    let url = "https://storage.googleapis.com/bserstat/data/"
    url += label + "/"
    if (tier === "all") {
      url += "armor_all.json"
    }else {
      url += "armor_high.json"
    }
    axios.get<any>(url)
      .then((response: any) => {
        if (isBefore) {
          setBeforeJson(response.data)
        }else {
          setJson(response.data)
        }
      })
      .catch((err: any) => {
        console.error(err)
      })

  }

  useEffect(() => {
    // console.log("effect:", prop)
    fetchUserRankJson(prop.tier, prop.label);
    if (prop.before !== "") {
      fetchUserRankJson(prop.tier, prop.before, true);
    }
  }, [prop]);

  function textCell(text: string, record: any): any {
    return t(text, prop.lang)
  }

  function valueCell(mode: string, column: string, isRawNumber = false, isReverseColor = false): (text: number, record: any) => any {
    return function (text: number, record: any): any {
      // console.log(record.armorTypeName, record.armorName, column)
      let before: any = null
      if (beforeJson.TypeList.length !== 0) {
        const tmp1: any = beforeJson.TypeList.find((el: any) => {
          return el.Name === record.armorTypeName
        })
        if (tmp1 !== undefined) {
          console.log("tmp1: ", tmp1, record.armorName)
          const tmp2: any = tmp1.ArmorList.find((el: any) => {
            return el.Name === record.armorName
          })
          if (tmp2 !== undefined) {
            console.log("tmp2: ", tmp2)
            const tmp3: any = tmp2.ModeList.find((el: any) => {
              return el.Mode === mode
            })
            console.log("tmp3: ", tmp3)

            if (tmp3.hasOwnProperty(column)) {
              // console.log("winrate: ", tmp3[column])
              before = tmp3[column]
            }
          }
        }
      }
      return valueRender(text, before, isRawNumber, isReverseColor);
    }
  }

  let title = "Armor(All)"
  if (prop.tier === "high") {
    title = "Armor(High Tier)"
  }


  interface FilterSet {
    text: string;
    value: string
  }

  function ArmorTypeFilter(json: { TypeList: any[] }, lang: string) {
    let uniqueArmorTypeList: FilterSet[] = []
    json.TypeList.forEach((armorType: any) => {
      if (armorType.Name === "") {
        return
      }
      uniqueArmorTypeList.push({text: t(armorType.Name, lang), value: armorType.Name})
    })
    return uniqueArmorTypeList;
  }

  function ArmorFilter(json: { TypeList: any[] }, lang: string) {
    let uniqueArmorList: FilterSet[] = []
    json.TypeList.forEach((armorType: any) => {
      if (armorType.WeaponTypeList === null) {
        return
      }
      armorType.ArmorList.forEach((armor: any) => {
        uniqueArmorList.push({text: t(armor.Name, lang), value: armor.Name})
      })
    })
    return uniqueArmorList
  }


  const columns = [
    {
      title: "",
      children: [
        {
          title: t('Type', prop.lang),
          dataIndex: 'armorTypeName',
          sorter: (a: Row, b: Row) => stringSort(a.armorTypeName, b.armorTypeName),
          filters: ArmorTypeFilter(json,prop.lang),
          onFilter: (value: any, record: any) => {
            if (record.armorTypeName === "Base Win Rate") {
              return true
            }
            return record.armorTypeName === value
          },
          filterMultiple: true,
          render: textCell,
        },
        {
          title: t('Armor', prop.lang),
          dataIndex: 'armorName',
          sorter: (a: Row, b: Row) => stringSort(a.armorName, b.armorName),
          filters: ArmorFilter(json,prop.lang),
          onFilter: (value: any, record: any) => {
            if (record.armorTypeName === "Base Win Rate") {
              return true
            }
            return record.armorName === value
          },
          filterMultiple: true,
          render: textCell,
        }
      ]
    },
    {
      title: t("Solo", prop.lang),
      className: "border-left",
      style: {borderLeft: "solid #000 2px", backgroundColor: "black !important"},
      children: [
        {
          title: t('Win Rate', prop.lang),
          dataIndex: 'soloWinRate',
          align: "right",
          className: "border-left",
          render: valueCell("Solo", "WinRate"),
          sorter: (a: Row, b: Row) => a.soloWinRate - b.soloWinRate,

        },
        {
          title: t('Pick Rate', prop.lang),
          dataIndex: 'soloPickRate',
          align: "right",
          render: valueCell("Solo", "PickRate"),
          sorter: (a: Row, b: Row) => a.soloPickRate - b.soloPickRate,
        },
      ]
    },
    {
      title: t("Duo", prop.lang),
      className: "border-left",
      children: [
        {
          title: t('Win Rate', prop.lang),
          dataIndex: 'duoWinRate',
          align: "right",
          className: "border-left",
          render: valueCell("Duo", "WinRate"),
          sorter: (a: Row, b: Row) => a.duoWinRate - b.duoWinRate,

        },
        {
          title: t('Pick Rate', prop.lang),
          dataIndex: 'duoPickRate',
          align: "right",
          render: valueCell("Duo", "PickRate"),
          sorter: (a: Row, b: Row) => a.duoPickRate - b.duoPickRate,
        },
      ]
    },
    {
      title: t("Squad", prop.lang),
      className: "border-left",
      children: [
        {
          title: t('Win Rate', prop.lang),
          dataIndex: 'squadWinRate',
          align: "right",
          className: "border-left",
          render: valueCell("Squad", "WinRate"),
          sorter: (a: Row, b: Row) => a.squadWinRate - b.squadWinRate,

        },
        {
          title: t('Pick Rate', prop.lang),
          dataIndex: 'squadPickRate',
          align: "right",
          render: valueCell("Squad", "PickRate"),
          sorter: (a: Row, b: Row) => a.squadPickRate - b.squadPickRate,
        },
      ]
    },

  ];

  // console.log(prop.tier)

  return <RankTable title={title} columns={columns} data={makeData(json)} {...prop} />
}

export default Armor;