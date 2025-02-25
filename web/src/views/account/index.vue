<template>
  <div class="account-container">
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">新增账户</el-button>
    </div>

    <el-table :data="accountList" v-loading="loading">
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="password" label="密码" show-overflow-tooltip />
      <el-table-column prop="url" label="网址" />
      <el-table-column prop="timestamp" label="创建时间" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      :title="dialogType === 'add' ? '新增账户' : '编辑账户'"
      v-model="dialogVisible"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
        <el-form-item label="网址" prop="url">
          <el-input v-model="form.url" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { AccountRecord } from '@/types/account'
import type { FormInstance } from 'element-plus'

import { getAccountList, addAccount, updateAccount, deleteAccount } from '@/api/account'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const accountList = ref<AccountRecord[]>([])

interface FormData {
  id: string | number
  username: string
  password: string
  url: string
}

const form = ref<FormData>({
  id: '',
  username: '',
  password: '',
  url: ''
})

const formRef = ref<FormInstance>()

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ],
  url: [
    { required: true, message: '请输入网址', trigger: 'blur' }
  ]
}

const loadData = async () => {
  try {
    loading.value = true
    const response = await getAccountList()
    accountList.value = response.data
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

const handleAdd = () => {
  dialogType.value = 'add'
  form.value = {
    id: '',
    username: '',
    password: '',
    url: ''
  }
  dialogVisible.value = true
}

const handleEdit = (row: AccountRecord) => {
  dialogType.value = 'edit'
  form.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = async (row: AccountRecord) => {
  try {
    await ElMessageBox.confirm('确认删除该记录?')
    await deleteAccount(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    // 用户取消删除
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    if (dialogType.value === 'add') {
      await addAccount({
        ...form.value,
        userId: Number(localStorage.getItem('userId'))
      })
    } else {
      await updateAccount(form.value)
    }
    
    dialogVisible.value = false
    ElMessage.success(`${dialogType.value === 'add' ? '新增' : '编辑'}成功`)
    loadData()
  } catch (error: any) {
    if (error?.message) {
      ElMessage.error(error.message)
    } else {
      ElMessage.error('操作失败')
    }
  }
}
</script>