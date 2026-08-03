/* Selectors */
var addBtn = document.querySelector('.addBtn');
var modelAdd = document.querySelector('.model-add');
var exitModel = document.querySelector('.exit-model');
var saveButton = document.querySelector('.saveModel');
var updateBtn = document.querySelector('.updateBtn');
var cancelButton = document.querySelector('.cancelModel');

var taskTitleInput = document.getElementById('TaskTitleInput');
var categoryInput = document.getElementById('CategoryInput');
var dueDateInput = document.getElementById('DueDateInput');
var notesInput = document.getElementById('NotesInput');
var favInput = document.getElementById('favInput');
var completedInput = document.getElementById('completedInput');

var tasksList = [];
var selectedTaskIndex = null;
var storageKey = 'taskHubData_pure';

//SweetAlert
const AppSwal = Swal.mixin({
    customClass: { popup: 'custom-swal-popup' }
});


addBtn.addEventListener('click', openModalForAdd);
exitModel.addEventListener('click', closeModal);
cancelButton.addEventListener('click', closeModal);

function openModalForAdd() {
    modelAdd.classList.remove('hidden');
    saveButton.classList.remove('hidden');
    updateBtn.classList.add('hidden');
    document.getElementById('modalTitle').innerText = 'Add New Task';
    clearInputs();
    setMinDateTime();
}

function closeModal() {
    modelAdd.classList.add('hidden');
    clearInputs();
}


function getCurrentDateTimeFormatted() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function setMinDateTime() {
    if (dueDateInput) {
        const currentNow = getCurrentDateTimeFormatted();
        dueDateInput.min = currentNow;
    }
}

if (dueDateInput) {
    dueDateInput.addEventListener('change', function () {
        const currentNow = getCurrentDateTimeFormatted();
        if (this.value && this.value < currentNow) {
            AppSwal.fire({
                title: "Invalid Time!",
                text: "You cannot select a past date or time.",
                icon: "warning",
                timer: 2000,
                showConfirmButton: false
            });
            this.value = currentNow;
        }
    });
}

// LocalStorage 
if (localStorage.getItem(storageKey) !== null) {
    tasksList = JSON.parse(localStorage.getItem(storageKey));
    displayBoard(tasksList);
} else {
    tasksList = [];
    displayBoard(tasksList);
}

// SaveTask
saveButton.addEventListener('click', function (e) {
    e.preventDefault();
    if (!validateTitle()) return;

    var task = {
        id: Date.now(),
        title: taskTitleInput.value.trim(),
        category: categoryInput.value || 'General',
        dueDate: dueDateInput.value || 'No date',
        notes: notesInput.value.trim(),
        isImportant: favInput.checked,
        isCompleted: completedInput.checked
    };

    tasksList.push(task);
    saveAndRefresh();
    closeModal();

    AppSwal.fire({ title: "Added!", text: "Task created successfully", icon: "success", timer: 1200, showConfirmButton: false });
});

function displayBoard(list) {
    var todoContainer = document.getElementById('todo-list');
    var importantContainer = document.getElementById('important-list');
    var doneContainer = document.getElementById('done-list');

    todoContainer.innerHTML = '';
    importantContainer.innerHTML = '';
    doneContainer.innerHTML = '';

    var todoCount = 0, impCount = 0, doneCount = 0;

    list.forEach((task, index) => {
        var cardHTML = createCardHTML(task, index);

        if (task.isCompleted) {
            doneContainer.innerHTML += cardHTML;
            doneCount++;
        } else if (task.isImportant) {
            importantContainer.innerHTML += cardHTML;
            impCount++;
        } else {
            todoContainer.innerHTML += cardHTML;
            todoCount++;
        }
    });

    if (todoCount === 0) {
        todoContainer.innerHTML = getEmptyStateHTML('fa-clipboard-list', 'No pending tasks');
    }
    if (impCount === 0) {
        importantContainer.innerHTML = getEmptyStateHTML('fa-star', 'No important tasks');
    }
    if (doneCount === 0) {
        doneContainer.innerHTML = getEmptyStateHTML('fa-circle-check', 'No completed tasks yet');
    }

    document.getElementById('todo-count').innerText = todoCount;
    document.getElementById('important-count').innerText = impCount;
    document.getElementById('done-count').innerText = doneCount;

    updateStatsAndProgress();
}

function getEmptyStateHTML(iconClass, message) {
    return `
        <div class="empty-state">
            <i class="fa-solid ${iconClass}"></i>
            <p>${message}</p>
        </div>
    `;
}

function createCardHTML(task, index) {
    var checkIcon = task.isCompleted ? 'fa-solid fa-circle-check text-success' : 'fa-regular fa-circle';
    var starIcon = task.isImportant ? 'fa-solid fa-star text-warning' : 'fa-regular fa-star';
    
    
    var completedClass = task.isCompleted ? 'completed-card' : '';

    return `
        <div class="task-card ${completedClass}">
            <div>
                <div class="task-card-top">
                    <span class="cat-tag">${escapeHtml(task.category)}</span>
                    <span class="date-tag">${task.dueDate}</span>
                </div>
                <h4>${escapeHtml(task.title)}</h4>
                <p>${escapeHtml(task.notes) || '<em>No additional details</em>'}</p>
            </div>
            <div class="task-card-footer">
                <div>
                    <button title="Toggle Complete" onclick="toggleComplete(${index})" class="action-btn"><i class="${checkIcon}"></i></button>
                    <button title="Toggle Important" onclick="toggleImportant(${index})" class="action-btn"><i class="${starIcon}"></i></button>
                </div>
                <div>
                    <button title="Edit" onclick="setupEdit(${index})" class="action-btn"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button title="Delete" onclick="deleteTask(${index})" class="action-btn text-danger"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        </div>
    `;
}

function setupEdit(index) {
    selectedTaskIndex = index;
    var task = tasksList[index];

    setMinDateTime();
    taskTitleInput.value = task.title;
    categoryInput.value = task.category;
    dueDateInput.value = task.dueDate !== 'No date' ? task.dueDate : '';
    notesInput.value = task.notes;
    favInput.checked = task.isImportant;
    completedInput.checked = task.isCompleted;

    modelAdd.classList.remove('hidden');
    saveButton.classList.add('hidden');
    updateBtn.classList.remove('hidden');
    document.getElementById('modalTitle').innerText = 'Edit Task';
}

updateBtn.addEventListener('click', function () {
    if (!validateTitle()) return;

    tasksList[selectedTaskIndex].title = taskTitleInput.value.trim();
    tasksList[selectedTaskIndex].category = categoryInput.value || 'General';
    tasksList[selectedTaskIndex].dueDate = dueDateInput.value || 'No date';
    tasksList[selectedTaskIndex].notes = notesInput.value.trim();
    tasksList[selectedTaskIndex].isImportant = favInput.checked;
    tasksList[selectedTaskIndex].isCompleted = completedInput.checked;

    saveAndRefresh();
    closeModal();

    AppSwal.fire({ title: "Updated!", text: "Task details updated", icon: "success", timer: 1200, showConfirmButton: false });
});

function deleteTask(index) {
    AppSwal.fire({
        title: "Delete Task?",
        text: "Are you sure you want to delete this?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#EF4444",
        confirmButtonText: "Yes, delete"
    }).then((result) => {
        if (result.isConfirmed) {
            tasksList.splice(index, 1);
            saveAndRefresh();
            AppSwal.fire({ title: "Deleted!", text: "Task details Deleted", icon: "success", timer: 1200, showConfirmButton: false });
        }
    });
}

function toggleComplete(index) {
    tasksList[index].isCompleted = !tasksList[index].isCompleted;
    saveAndRefresh();
}

function toggleImportant(index) {
    tasksList[index].isImportant = !tasksList[index].isImportant;
    saveAndRefresh();
}

function searchTask() {
    var term = document.getElementById('serachInput').value.toLowerCase();
    var filtered = tasksList.filter(task => 
        task.title.toLowerCase().includes(term) || 
        task.category.toLowerCase().includes(term) ||
        task.notes.toLowerCase().includes(term)
    );
    displayBoard(filtered);
}

function updateStatsAndProgress() {
    var total = tasksList.length;
    var completed = tasksList.filter(t => t.isCompleted).length;
    var percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    document.getElementById('progress-text').innerText = `You completed ${completed} of ${total} tasks (${percentage}%)`;
    document.getElementById('progressBar').style.width = `${percentage}%`;
    var catSummary = {};
    tasksList.forEach(t => {
        catSummary[t.category] = (catSummary[t.category] || 0) + 1;
    });

    var catContainer = document.getElementById('category-summary');
    if (Object.keys(catSummary).length > 0) {
        catContainer.innerHTML = Object.keys(catSummary).map(cat => `
            <div class="cat-item">
                <span>${escapeHtml(cat)}</span>
                <strong>${catSummary[cat]}</strong>
            </div>
        `).join('');
    } else {
        catContainer.innerHTML = '<p style="font-size:12px; color:var(--text-secondary)">No categories yet</p>';
    }
}

function saveAndRefresh() {
    localStorage.setItem(storageKey, JSON.stringify(tasksList));
    displayBoard(tasksList);
}

function clearInputs() {
    taskTitleInput.value = '';
    categoryInput.value = '';
    dueDateInput.value = '';
    notesInput.value = '';
    favInput.checked = false;
    completedInput.checked = false;
    document.getElementById('titleAlert').classList.add('hidden');
}

function validateTitle() {
    if (taskTitleInput.value.trim().length >= 3) {
        document.getElementById('titleAlert').classList.add('hidden');
        return true;
    } else {
        document.getElementById('titleAlert').classList.remove('hidden');
        return false;
    }
}

function escapeHtml(str) {
    return str ? str.replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]; }) : '';
}


/* Theme Mode */

const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');

const savedTheme = localStorage.getItem('theme');

if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    themeIcon.classList.replace('fa-sun', 'fa-moon');
} else {
    document.body.classList.remove('light-theme');
    themeIcon.classList.replace('fa-moon', 'fa-sun');
}

themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    
    const isLight = document.body.classList.contains('light-theme');
    
    if (isLight) {
        themeIcon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'light');
    } else {
        themeIcon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark');
    }
});