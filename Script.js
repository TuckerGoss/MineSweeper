
function Space()
{
this.mine = false; //does this space have a mine?
this.numMine = 0; //number of mines in adjacent spaces defaults to -1 while still creating the board
this.flag = false; //does this space have a flag?
this.button = null; // the button that represents the space (should be the parent of this.display)
this.display = null; //This will be the p object that shows how many mines are next to this space
this.adjacent = null; // This will be an array that stores all adjacent spaces to the current space note that it should always have a lenght of 8 even if a node is on an edge in that case it out of bounds spaces should be null
}
const difficulty = document.getElementById("difficulty");
const board = document.getElementById("board");
const error = document.getElementById("error");
let started = false; //Gets set to true on assignMines() and set false when clearBoard() is ran
let grid =null; //This will be a 2d array that holds the information for each space
let currentMines = 0; //store the number of mines left for the currrent game only
let gameOver = false; //bool that stores wheather the game has ended (doesn't matter if the game ends in a win or loss)
let time = 0;
let timerId;

difficulty.addEventListener("change", e =>
{
    const selected = difficulty.value; //The selected value from the dropDown men
    let numRow = document.getElementById("RowCount");
    let settings = numRow.parentElement; //The settings div
    let numCol = document.getElementById("ColumnCount");
    let numMine = document.getElementById("MineCount");
    switch(selected) 
    {
        case "easy": //8x10 with 10 mines
            numRow.value = 8;
            numCol.value =10;
            numMine.value =10;
            settings.className = "hide";
            break;
        case "medium": //14x18 with 40 mines
            numRow.value = 14;
            numCol.value =18;
            numMine.value =40;
            settings.className = "hide";
            break;
        case "hard": //20x24 with 99
            numRow.value = 20;
            numCol.value =24;
            numMine.value =99;
            settings.className = "hide";
            break;
        case "custom":
            numRow.value = null;
            numCol.value =null;
            numMine.value =null;
            settings.className = "centered";
            break;
    }
}
);

board.addEventListener("click", e =>
{
    let btn = e.target.closest("button");
    if(btn != null && btn.parentElement.parentElement === board &&!gameOver) //the button is one of the squares in the board
    {
        let row = Number(btn.dataset.row);
        let col = Number(btn.dataset.col);
        if(started == false)
        {
            assignMines(currentMines, row, col);
            startTime();
        }
        let square = grid[row][col]; //stores the square this btn represents
        if(square.flag ==false)
        {
            if(btn.className =="Blue")
            {
                console.log(`grid[${row}][${col}].numMine = ${grid[row][col].numMine}]`);
                if(square.mine)
                {
                    btn.className = "Red";
                    btn.children[0].className = "text";
                    endGame(false);
                }
                else
                {
                     btn.className = "Green";
                    btn.children[0].className = "text";
                    if(square.numMine==0)
                    {
                        revealAdjacent(square);
                    }
                    if(currentMines==0 && checkEndGame())
                    {
                       endGame(true);
                    }
                }
            }
        }
    }
});

board.addEventListener("contextmenu", e =>
// need to make sure there are no edge cases with the remaining mines display due to there being more spaces than mines
{
    const btn = e.target.closest("button");
    if(btn != null && btn.parentElement.parentElement === board && started && !gameOver) //the button is one of the squares in the board and the game has started
    {
       e.preventDefault(); //prevents the normal menu that shows up when you right click from appearing
       if(btn.className == "Blue")
       {
        let row = Number(btn.dataset.row);
        let col = Number(btn.dataset.col);
        let square = grid[row][col];
        let remainingMines = document.getElementById("remaining");
        square.flag = !square.flag; //Toggles the flag
        if(square.flag) //square now has a flag
        {
            square.display.textContent = "F";
            square.display.className = "text";
            currentMines --;
            if(currentMines ==0 &&checkEndGame())
            {
                endGame(true);
            }
        }
        else //The square already had a flag
        {
            currentMines++;
            square.display.className = "hidden";
            if(square.mine)
            {
                square.display.textContent = "*";
            }
            else
            {
                square.display.textContent = square.numMine;
            }    
        }
        remainingMines.textContent = currentMines;

       }
    }
});


function createBoard(numRow, numCol,numMine)
{
    if(numMine > (numCol * numRow)-9) //there can be at most 9 less mines than spaces
    {
        error.className ="error";
    }
    else
    {
        clearBoard();
        document.getElementById("gameInfo").className ="gameInfo";
        grid = new Array(Number(numRow)).fill().map(_ => Array(Number(numCol)).fill(0));
        currentMines = numMine;
        document.getElementById("remaining").textContent = currentMines;
        //console.log(grid[0]);
        for( let row = 0; row <numRow; row++)
        {
            let r = document.createElement("div");
            r.className ="row";
            board.appendChild(r);
            for(let col = 0; col<numCol; col++)
            {
                //console.log(`grid[${row}][${col}]`)
                grid[row][col] = new Space();
                //console.log(`grid[${row}][${col}]`)
                let square = document.createElement("button");
                square.dataset.row = row;
                square.dataset.col = col;
                square.className = "Blue";
                let text = document.createElement("p");
                text.textContent = grid[row][col].numMine;
                text.className = "hidden";
                grid[row][col].display =text;
                grid[row][col].button = square;
                square.appendChild(text);
                r.appendChild(square);
            }
        }
        connectAdjacent();
    }
}

function assignMines(numMine, row, col)
// Parameters: number of mines, selected row, selected column
// The first space the player clicks on should not have any mines nor should any spaces adjacent to it 
{
    started = true;
    let mine =0;
    let numRow = grid.length;
    let numCol = grid[0].length;
    while(mine <numMine)
    {
        let randR =Math.floor(Math.random() *numRow);
        let randC =Math.floor(Math.random() *numCol);
        //console.log(`grid[${randR}][${randC}]`)
        if(!(randR >=row-1 &&randR<row+2)||!(randC>=col-1&&randC<col+2))
        {
            let space = grid[randR][randC];
            if(space.mine == false) //The space doesn't already have a mine
            {
                space.mine = true;
                space.numMine =0;
                space.display.textContent ="*";
                //console.log(`grid[${randR}][${randC}]`)
                mine++;
                for(let r =randR -1; r <randR+2; r++)
                {
                    if(r>=0 &&r<numRow) //r is a valid value for grid[row]
                    {
                        for(let c =randC-1; c<randC+2; c++)
                        {
                            if(c>=0 && c<numCol && grid[r][c].mine ==false) //c is a valid value for grid[col]
                            {
                                grid[r][c].numMine++;
                                grid[r][c].display.textContent = grid[r][c].numMine;
                            }
                        }
                    }
                }
            }
        }
    }
}

function connectAdjacent()
// fills out the adjacent squares for all spaces
// each square will have 8 adjacent square even if they are on the edge 
// if a square is on the edge then the adjacent squares that are out of bounds will be null
/* Here's what the format for the adjcent squares should look like on the board 

    [adjacent[0],adjacent[1],adjacent[2]],
    [adjacent[3],  current,  adjacent[3]],
    [adjacent[4],adjacent[5],adjacent[6]]

*/
{
for(let row = 0; row < grid.length; row++)// The row of the currnet square
    {
        for(let col = 0; col < grid[0].length; col++)// the column of the currnet square
        {
            let current = grid[row][col];
            current.adjacent = [null, null, null, null, null, null, null, null];
            let i = 0;// this stores the current position in the adjacent array
            for(let r = row -1; r < row+2; r++)
            {
                for(let c = col -1; c <col+2; c++)
                {
                    if((r>=0 && r<grid.length) &&(c>=0 && c<grid[0].length)&& !(r == row && c == col ))// if grid[r][c] is not out of bounds
                    {
                        current.adjacent[i] = grid[r][c];
                    }
                    // will leave the spot in the adjacent array as null if the spot is out of bounds
                    if(!(r == row && c==col))// This if statment makes sure there isn't a null in the middle of every adjacent array
                    {
                        i++;
                    }
                }
            }
        }
    }
}

function clearBoard()
// Used to reset the board before a new game starts
{
    board.innerHTML = null;
    grid = null;
    error.className ="hide";
    document.getElementById("MessageBackground").className = "hide";
    started = false;
    time = 0;
    gameOver = false;
    document.getElementById("timer").textContent = "00:00";
    clearInterval(timerId);

}
function startTime()
{
    timerId = setInterval(updateTime,1000); //note: don't include the parentheses next to the function name other wise it only calls the function once (IDK why)

}
function updateTime()
// updates the timer by 1 second
// format of timer: minutes:seconds ex: 00:00 or 01:15
{
    time ++;
    let second = time%60; //total number seconds passed
    let sec1 = second%10; //ones space of minute
    let sec10 = (second-sec1)/10; //tens place of seconds
    let minute = (time -second)/60; //total number of minutes passed
    let min1 = minute%10; //ones places of minute
    let min10  = (minute-min1)/10; //tens place of minute
    document.getElementById("timer").textContent =`${min10}${min1}:${sec10}${sec1}`;

}

function revealAll()
// reveals all spaces
// used when the player loses a game (called by endGame function)
{
    let numRow= grid.length;
    let numCol = grid[0].length;
    for(let r = 0; r<numRow; r++)
    {
        for(let c = 0; c<numCol; c++)
        {
            reveal(grid[r][c]);
        }
    }
}

function reveal(space)
//Used by revealAll, and revealAdjacent
//Simulates a space being clicked however it ignores wheather or not a flag is on the space
{
    if(space.button.className == "Blue") //The space is not already revealed
    {
        space.button.className = "Green";
        if(space.flag)
        {
            currentMines++; //if the space was incorrectly marked with a flag then add one back the total shown in the UI
            if(space.mine)
            {
                space.display.textContent = "*";
                space.button.className = "Red";
            }
            else
            {
                space.display.textContent = space.numMine;
            }
        }
        space.display.className = "text";
        if(space.mine)
        {
            space.button.className = "Red";
        }
    }
}

function trueClick(row, col)
//simulates clicking a space at grid[row][col]
// precondition: row and col must be valid indexs in there repective arrays
{
    grid[row][col].button.click();
}

function plantFlag(row, col)
{
    grid[row][col].button.contextmenu();
}

function revealAdjacent(space)
// Should only be called when a square has a 0 in it 
// assumes none of the adjacent squares have any mines
{
    for(let i =0; i <space.adjacent.length; i++)
    {
        // if(i>=8)// this if statement is primarily for debuging (Remove or comment out later)
        // {
        //     console.log(i);
        //     console.log(space);
        // }
        let current = space.adjacent[i];
        if(current != null &&current.button.className != "Green")// c is a valid col in grid and isn't already revealed
        {
            reveal(current);
            if(current.numMine ==0)
            {
                revealAdjacent(current);
            }
        }
    }
}

function checkEndGame()
// runs when currentMines = 0 and a space is left clicked or when right clicking a space causes currentMines to equal 0
// checks for any space that is left unrevaled and is not flaged, if it finds one returns false, else returns true
{
    for(let r = 0; r<grid.length;r++)
    {
        for(let c = 0; c<grid[0].length; c++)
        {
            let spaceColor = grid[r][c].button.className; //The class name for the space
            if(spaceColor =="Blue" &&grid[r][c].flag ==false) //As space is unrevealed and doesn't have a flag
            {
                return false;
            }
        }
    }
    return true;
}

function endGame(win)
// runs whenever the game ends i.e. the player clicks a mine or all spaces with mines have a flag and no other spaces are left unrevealed
// win is a bool that should be true if the player has won and false if the player loses
{
    clearInterval(timerId);
    let backGrd = document.getElementById("MessageBackground");
    let message = document.getElementById("EndMessage");
    gameOver = true;
    if(win)
    {
        backGrd.className = "winBackGrd";
        message.className = "win";
        message.textContent = "You Win :)";
    }
    else
    {
        backGrd.className = "loseBackGrd";
        message.className = "lose";
        message.textContent = "You Lose :(";
        revealAll();
    }
}
function autoSolve()
//The way this functions should work is that it will call logic functions in a loop and each of those functions will return a bool
//if a logic function returns true then it skip the rest and restart the while loop otherwise it will continue to the next logic function
//if all logic functions return false the the while loop will end leaving the game board in its current (likly unfinished) state 
{
    let clicked = true;// Used to represent if a logic function actual did something i.e. click a space or planted a flag
    while(gameOver == false && started ==true && clicked ==true)
    {
        clicked = false;
    }
}
/*
rules for all logic functions:
    •A flag should only be planted if you are 100% sure a spaces has a mine
    •all logic functions should have a bool as a parmeter and return a bool as well
    •any logic functions that require chance or guess work should only be ran after all
    functions with a guaranteed chance of detecting a mine or free space have been ran

*/
function logic0(clicked)
// if the number of flags adjacent to the space equals the nunber of mines adjacent to a space then reveal all other spaces adjacent to that space
{
    for(let row = 0; row<grid.length; row++)
    {

    }
}
function logic1(clicked)
// if the number of unrevealed spaces next to a space equals the number of adjacent mines then plant a flag at all those spaces
{

}
// function showBoard()
// {
//     let row = grid.length;
//     let col = grid[0].length;
//     for(let r = 0; r<row; r++)
//     {
//         for(let c = 0; c<col; c++)
//         {
//             console.log(`grid[${r}][${c}].mine = ${grid[r][c].mine}`);
//         }
//         console.log("\n");
//     }
// }
