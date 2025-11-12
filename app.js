const API_URL = 'https://eight32302227-contacts-backend.onrender.com/api';

const contactsList = document.getElementById('contacts-list');
const addForm = document.getElementById('add-form');
const editForm = document.getElementById('edit-form');

// 过滤器元素
const filterNameInput = document.getElementById('filter-name');
const filterTagSelect = document.getElementById('filter-tag');

// 获取所有选中的标签 (用于添加和修改表单)
function getCheckedTags(checkboxContainerId) {
    const checkboxes = document.querySelectorAll(`#${checkboxContainerId} input[type="checkbox"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value).join(',');
}

// 设置标签的选中状态 (用于修改表单填充)
function setCheckedTags(checkboxContainerId, tagsString) {
    const checkboxes = document.querySelectorAll(`#${checkboxContainerId} input[type="checkbox"]`);
    const currentTags = tagsString ? tagsString.split(',') : [];
    checkboxes.forEach(cb => {
        cb.checked = currentTags.includes(cb.value);
    });
}


// --- 功能 A: 获取并显示所有联系人 (Read) & 过滤 ---
async function fetchContacts() {
    contactsList.innerHTML = '<li>加载中...</li>';

    try {
        const response = await fetch(`${API_URL}/contacts`);
        let contacts = await response.json();

        // --- 过滤逻辑 ---
        const nameFilter = filterNameInput.value.toLowerCase();
        const tagFilter = filterTagSelect.value;

        contacts = contacts.filter(contact => {
            const matchesName = nameFilter === '' || contact.name.toLowerCase().includes(nameFilter);
            const matchesTag = tagFilter === '' || (contact.tags && contact.tags.includes(tagFilter));
            return matchesName && matchesTag;
        });
        // --- 过滤逻辑结束 ---

        contactsList.innerHTML = '';

        if (contacts.length === 0) {
            contactsList.innerHTML = '<li>暂无联系人，或没有匹配的联系人</li>';
            return;
        }

        contacts.forEach(contact => {
            const li = document.createElement('li');
            // 处理标签显示
            const tagsHtml = contact.tags ?
                contact.tags.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('') : '';

            li.innerHTML = `
                <div class="contact-main-info">
                    <strong>${contact.name}</strong> <span>(${contact.phone})</span>
                </div>
                <div class="contact-details">
                    ${contact.address ? `<span><i class="fas fa-map-marker-alt"></i> ${contact.address}</span>` : ''}
                    ${contact.email ? `<span><i class="fas fa-envelope"></i> ${contact.email}</span>` : ''}
                    ${tagsHtml ? `<span><i class="fas fa-tags"></i> ${tagsHtml}</span>` : ''}
                </div>
                <div class="actions">
                    <button class="edit-btn" 
                            data-id="${contact.id}" 
                            data-name="${contact.name}" 
                            data-phone="${contact.phone}"
                            data-address="${contact.address || ''}"
                            data-email="${contact.email || ''}"
                            data-tags="${contact.tags || ''}">
                        <i class="fas fa-edit"></i> 修改
                    </button>
                    <button class="delete-btn" data-id="${contact.id}">
                        <i class="fas fa-trash-alt"></i> 删除
                    </button>
                </div>
            `;
            contactsList.appendChild(li);
        });

    } catch (error) {
        console.error('获取联系人失败:', error);
        contactsList.innerHTML = '<li>加载联系人失败</li>';
    }
}

// --- 功能 B: 添加联系人 (Create) ---
addForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('add-name').value;
    const phone = document.getElementById('add-phone').value;
    const address = document.getElementById('add-address').value;
    const email = document.getElementById('add-email').value;
    const tags = getCheckedTags('add-tag-checkboxes'); // 获取选中的标签

    try {
        const response = await fetch(`${API_URL}/contacts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, phone, address, email, tags }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '添加失败');
        }

        // 清空表单
        addForm.reset(); // 重置所有表单字段
        setCheckedTags('add-tag-checkboxes', ''); // 清空标签选中状态

        fetchContacts();

    } catch (error) {
        console.error('添加联系人失败:', error);
        alert('添加联系人失败: ' + error.message);
    }
});

// --- 功能 C 和 D: 修改 (Update) 和 删除 (Delete) ---
contactsList.addEventListener('click', async (e) => {

    // (功能 D: 删除)
    if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
        const targetBtn = e.target.classList.contains('delete-btn') ? e.target : e.target.closest('.delete-btn');
        const id = targetBtn.dataset.id;

        if (!confirm('确定要删除吗？')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/contacts/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('删除失败');
            }
            fetchContacts();
        } catch (error) {
            console.error('删除失败:', error);
            alert('删除失败: ' + error.message);
        }
    }

    // (功能 C: 修改 - 第1步：点击修改按钮)
    if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
        const targetBtn = e.target.classList.contains('edit-btn') ? e.target : e.target.closest('.edit-btn');
        const id = targetBtn.dataset.id;
        const name = targetBtn.dataset.name;
        const phone = targetBtn.dataset.phone;
        const address = targetBtn.dataset.address;
        const email = targetBtn.dataset.email;
        const tags = targetBtn.dataset.tags;

        document.getElementById('edit-id').value = id;
        document.getElementById('edit-name').value = name;
        document.getElementById('edit-phone').value = phone;
        document.getElementById('edit-address').value = address;
        document.getElementById('edit-email').value = email;
        setCheckedTags('edit-tag-checkboxes', tags); // 设置标签选中状态

        editForm.style.display = 'block';
        addForm.style.display = 'none';
    }
});

// (功能 C: 修改 - 第2步：提交修改表单)
editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('edit-name').value;
    const phone = document.getElementById('edit-phone').value;
    const address = document.getElementById('edit-address').value;
    const email = document.getElementById('edit-email').value;
    const tags = getCheckedTags('edit-tag-checkboxes'); // 获取选中的标签

    try {
        const response = await fetch(`${API_URL}/contacts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, phone, address, email, tags }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '修改失败');
        }

        fetchContacts();

        editForm.style.display = 'none';
        addForm.style.display = 'block';

    } catch (error) {
        console.error('修改失败:', error);
        alert('修改失败: ' + error.message);
    }
});

// (功能 C: 修改 - 第3步：点击取消按钮)
document.getElementById('cancel-edit').addEventListener('click', () => {
    editForm.style.display = 'none';
    addForm.style.display = 'block';
});

// --- 过滤器事件监听 ---
filterNameInput.addEventListener('input', fetchContacts); // 姓名输入框变化时过滤
filterTagSelect.addEventListener('change', fetchContacts); // 标签选择器变化时过滤


// --- 页面加载时，自动执行一次 ---
document.addEventListener('DOMContentLoaded', fetchContacts);