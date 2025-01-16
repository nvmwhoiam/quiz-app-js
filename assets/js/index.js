'use strict';

import { setClosedToOpen, setClosingToClosed } from "./functions.js";

const backdrop = document.querySelector('.backdrop');
const modal = document.querySelector('.modal');
const categoryName = modal.querySelector('.category_name');
const quizBody = modal.querySelector(".quizzes");
const nextButton = document.querySelector('[data-btn="next"]');

let score = 0; // Track the score
const questionMap = new Map(); // Store question index and its correct answer index

let timer; // Timer interval
let timeRemaining = 15; // Timer starts at 15 seconds

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch('./assets/js/quizzes.json');
        const quizData = await response.json();

        for (const [index, element] of quizData.entries()) {
            const { category } = element;
            quizCategories(category, index);
            questionMap.set(index, element);
        }

    } catch (error) {
        console.log("Error fetching quiz data: ", error);
    }
});

document.addEventListener('click', (e) => {
    const categoryBtn = e.target.closest('[data-category_btn]');
    if (categoryBtn) {

        openModal();

        const selectedCategory = categoryBtn.getAttribute('data-category_btn');
        fetchQuestions(Number(selectedCategory));
    }

    const closeModalBtn = e.target.closest('[data-btn="close_modal"]');
    if (closeModalBtn) {
        closeModal();
    }

    const answerBtn = e.target.closest('[data-answer]');
    if (answerBtn) {
        const selectedAnswer = parseInt(answerBtn.getAttribute('data-answer'));
        const activeQuestion = document.querySelector('.modal_body_item.active');
        const currentQuestion = parseInt(activeQuestion.getAttribute('data-question_id'));
        const currentCategory = quizBody.getAttribute('data-question_category');

        const categoryObject = questionMap.get(Number(currentCategory));

        if (categoryObject && categoryObject.questions) {
            const question = categoryObject.questions[currentQuestion];

            if (question) {
                if (question.correct === selectedAnswer) {
                    score++;
                    answerBtn.classList.add("correct");
                    console.log("Correct answer selected!");
                } else {
                    answerBtn.classList.add("incorrect");
                    const correctOption = document.querySelector(`[data-answer="${question.correct}"]`);
                    correctOption.classList.add("correct");
                    console.log("Incorrect answer selected.");
                }
            }
        }

        setTimeout(() => moveToNextQuestion(), 1000);
    }

    const nextBtn = e.target.closest('[data-btn="next"]');
    if (nextBtn) {
        moveToNextQuestion();
    }

    const resetBtn = e.target.closest('[data-btn="reset"]');
    if (resetBtn) {
        resetQuiz();
    }
});

function fetchQuestions(index) {
    if (questionMap.has(index)) {
        const selectedQuiz = questionMap.get(index);
        categoryName.innerText = selectedQuiz.category;

        for (const [questionIndex, question] of selectedQuiz.questions.entries()) {
            fetchQuiz(question, questionIndex, selectedQuiz.questions.length);
        }
    }

    quizBody.setAttribute('data-question_category', index);

    appendResultSection();

    startTimer();
}

function appendResultSection() {
    const resultHTML = `
        <div class="modal_body_item result_section">
            <p class="result">Your score will be displayed here.</p>
        </div>
    `;

    quizBody.insertAdjacentHTML("beforeend", resultHTML);
}

function quizCategories(category, index) {
    const itemHTML = `
        <button type="button" class="btn_btn" data-category_btn="${index}" aria-label="${category} button">
            ${category}
        </button>
    `;

    const container = document.querySelector("#quiz_categories");
    if (container) {
        container.insertAdjacentHTML("beforeend", itemHTML);
    }
}

function fetchQuiz(question, index, totalQuestions) {
    const questionCounter = `${index + 1} of ${totalQuestions}`;

    const isFirst = index === 0 ? 'active' : '';

    const optionsHTML = question.options
        .map((option, optionIndex) => `
        <li class="answer_item">
            <button type="button" class="answer_btn" aria-label="Answer button" data-answer="${optionIndex}">
                ${option}
            </button>
        </li>
        `)
        .join("");

    const itemHTML = `
        <div class="modal_body_item ${isFirst}" data-question_id="${index}">
            <p class="question_counter">${questionCounter}</p> 
            <p class="question_title">${question.question}</p>
            <ul class="answer_list">
                ${optionsHTML}
            </ul>
        </div>
        `;

    if (quizBody) {
        quizBody.insertAdjacentHTML("beforeend", itemHTML);
    }
}

function moveToNextQuestion() {
    clearInterval(timer);

    if (nextButton) {
        nextButton.disabled = true;
    }

    const activeItem = document.querySelector('.modal_body_item.active');
    if (activeItem) {
        const nextItem = activeItem.nextElementSibling;

        if (nextItem && nextItem.classList.contains('modal_body_item')) {
            activeItem.classList.remove('active');
            nextItem.classList.add('active');

            startTimer();
        }

        const isLastItem = !nextItem || !nextItem.nextElementSibling;
        if (isLastItem && nextButton) {
            showFinalScore();
            nextButton.disabled = true;
        } else {
            if (nextButton) {
                setTimeout(() => nextButton.disabled = false, 500);
            }
        }
    }

    updateProgressBar();
}

function resetQuiz() {
    clearInterval(timer);
    score = 0;

    const bodyItem = document.querySelector('.modal_body_item');
    const activeItem = document.querySelector('.modal_body_item.active');
    if (activeItem) {
        activeItem.classList.remove("active");
    }

    bodyItem.classList.add("active");

    if (nextButton) {
        nextButton.disabled = false;
    }

    const progressFill = document.querySelector('.progress_fill');
    if (progressFill) {
        progressFill.style.width = "10%";
    }

    startTimer();

    const resultSection = document.querySelector('.result_section .result');
    if (resultSection) {
        resultSection.innerText = "Your score will be displayed here.";
    }
}

function startTimer() {
    clearInterval(timer); // Ensure no duplicate timers
    timeRemaining = 15;
    const timerElement = modal.querySelector(".timer");
    timerElement.textContent = timeRemaining.toString().padStart(2, "0");
    timerElement.classList.remove("warning");

    timer = setInterval(() => {
        timeRemaining--;
        timerElement.textContent = timeRemaining.toString().padStart(2, "0");

        if (timeRemaining <= 5) {
            timerElement.classList.add("warning");
        }

        if (timeRemaining <= 0) {
            clearInterval(timer);
            moveToNextQuestion();
        }
    }, 1000);
}

function showFinalScore() {
    clearInterval(timer);

    const resultSection = document.querySelector('.result_section .result');
    const categoryIndex = Number(quizBody.getAttribute('data-question_category'));

    const totalQuestions = questionMap.get(categoryIndex).questions.length;
    const percentage = (score / totalQuestions) * 100;

    let message;
    if (percentage === 100) {
        message = "Perfect! You're a genius!";
    } else if (percentage >= 80) {
        message = "Great job!";
    } else if (percentage >= 50) {
        message = "Not bad, keep practicing!";
    } else {
        message = "Better luck next time!";
    }

    resultSection.textContent = `You scored ${score} out of ${totalQuestions}! ${message}`;
}

function updateProgressBar() {
    const progressFill = document.querySelector('.progress_fill');
    const categoryIndex = Number(quizBody.getAttribute('data-question_category'));

    const totalQuestions = questionMap.get(categoryIndex).questions.length;

    const activeItem = document.querySelector('.modal_body_item.active');
    const currentQuestion = Number(activeItem.getAttribute('data-question_id'));

    const progressPercentage = ((currentQuestion + 1) / totalQuestions) * 100;
    progressFill.style.width = `${progressPercentage}%`;
}

function openModal() {
    quizBody.innerHTML = '';
    categoryName.innerHTML = '';

    setClosedToOpen(backdrop);
    setClosedToOpen(modal);
}

function closeModal() {
    setClosingToClosed(backdrop);
    setClosingToClosed(modal);
    quizBody.removeAttribute('data-question_category');
    clearInterval(timer);
}