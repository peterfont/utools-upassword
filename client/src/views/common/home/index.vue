<template>
  <div class="mod-home">
    <el-tabs v-model="activeTab">
      <el-tab-pane
        label="工具集合"
        name="customer-service"
      >
        <div class="customer-service">
          <el-row :gutter="20">
            <el-col
              v-for="(item, index) in customerServices"
              :key="index"
              :span="6"
            >
              <el-card class="service-item">
                <h3>{{ item.title }}</h3>
                <img
                  :src="item.imgSrc"
                  :alt="item.title"
                  @click="item.onClick"
                >
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
      <el-tab-pane
        label="项目介绍"
        name="introduction"
      >
        <div class="content">
          <p>一个基于spring boot、spring oauth2.0、mybatis、redis的轻量级、前后端分离、拥有完整sku和下单流程的完全开源商城</p>
          <p>&nbsp;</p>
          <p>该项目仅供学习参考、可供个人学习使用、如需商用联系作者进行授权，否则必将追究法律责任</p>
          <p>&nbsp;</p>
          <h2>前言</h2>
          <p>
            <code>mall4j商城</code>项目致力于为中小企业打造一个完整、易于维护的开源的电商系统，采用现阶段流行技术实现。后台管理系统包含商品管理、订单管理、运费模板、规格管理、会员管理、运营管理、内容管理、统计报表、权限管理、设置等模块。
          </p>
          <p>&nbsp;</p>
          <h2>技术选型</h2>
          <figure>
            <table
              border="1"
              cellspacing="0"
              cellpadding="5px"
            >
              <thead>
                <tr>
                  <th>技术</th>
                  <th>版本</th>
                  <th>说明</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Spring Boot</td>
                  <td>3.0.4</td>
                  <td>MVC核心框架</td>
                </tr>
                <tr>
                  <td>MyBatis</td>
                  <td>3.5.0</td>
                  <td>ORM框架</td>
                </tr>
                <tr>
                  <td>MyBatisPlus</td>
                  <td>3.5.3.1</td>
                  <td>基于mybatis，使用lambda表达式的</td>
                </tr>
                <tr>
                  <td>Swagger-UI</td>
                  <td>4.0.0</td>
                  <td>文档生产工具</td>
                </tr>
                <tr>
                  <td>redisson</td>
                  <td>3.19.3</td>
                  <td>对redis进行封装、集成分布式锁等</td>
                </tr>
                <tr>
                  <td>hikari</td>
                  <td>3.2.0</td>
                  <td>数据库连接池</td>
                </tr>
                <tr>
                  <td>log4j2</td>
                  <td>2.17.2</td>
                  <td>更快的log日志工具</td>
                </tr>
                <tr>
                  <td>lombok</td>
                  <td>1.18.8</td>
                  <td>简化对象封装工具</td>
                </tr>
                <tr>
                  <td>hutool</td>
                  <td>5.8.15</td>
                  <td>更适合国人的java工具集</td>
                </tr>
                <tr>
                  <td>xxl-job</td>
                  <td>2.3.1</td>
                  <td>定时任务</td>
                </tr>
              </tbody>
            </table>
          </figure>
          <p>&nbsp;</p>
          <h2>部署教程</h2>
          <p>&nbsp;</p>
          <h3>1.开发环境</h3>
          <figure>
            <table
              border="1"
              cellspacing="0"
              cellpadding="5px"
            >
              <thead>
                <tr>
                  <th>工具</th>
                  <th>版本</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>jdk</td>
                  <td>17</td>
                </tr>
                <tr>
                  <td>mysql</td>
                  <td>5.7+</td>
                </tr>
                <tr>
                  <td>redis</td>
                  <td>3.2+</td>
                </tr>
              </tbody>
            </table>
          </figure>
          <h3>2.启动</h3>
          <ul>
            <li>推荐使用idea，安装lombok插件，使用idea导入maven项目</li>
            <li>
              将shop.sql导入到mysql中，修改
              <code>application-dev.yml</code>更改 datasource.url、user、password
            </li>
            <li>启动redis</li>
            <li>
              通过
              <code>WebApplication</code>启动项目后台接口，
              <code>ApiApplication</code> 启动项目前端接口
            </li>
          </ul>
          <p>&nbsp;</p>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElTabs, ElTabPane, ElCard, ElRow, ElCol } from 'element-plus'
import web from './kefu_web.jpeg'
import min from './kefu_mini.jpeg'
import customerMini from './customer_mini.jpg'
import riderMini from './rider_mini.jpg'
import adminMini from './admin_mini.jpg'

const activeTab = ref('customer-service')

const openWebCustomerService = () => {
  window.open('https://mpkf.weixin.qq.com', '_blank')
}

const customerServices = [
  {
    title: '网页客服(点击跳转)',
    imgSrc: web,
    onClick: openWebCustomerService
  },
  {
    title: '小程序客服',
    imgSrc: min,
    onClick: () => {}
  },
  {
    title: '客户端小程序',
    imgSrc: customerMini,
    onClick: () => {}
  },
  {
    title: '骑手端小程序',
    imgSrc: riderMini,
    onClick: () => {}
  },
  {
    title: '管理员端小程序',
    imgSrc: adminMini,
    onClick: () => {}
  }
]
</script>

<style lang="scss" scoped>
.mod-home {
  line-height: 1.5;
}

.customer-service {
  padding: 20px;

  .service-item {
    text-align: center;

    img {
      max-width: 100%;
      height: auto;
      cursor: pointer;
    }
  }
}
</style>
