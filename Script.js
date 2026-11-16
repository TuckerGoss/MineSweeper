function Space()
//This is all of the data that the spaces need to store 
{
this.mine = false; //does this space have a mine?
this.numMine = 0; //number of mines in adjacent spaces defaults to -1 while still creating the board
this.flag = false; //does this space have a flag?
this.button = null; // the button that represents the space (should be the parent of this.display)
this.display = null; //This will be the p object that shows how many mines are next to this space
this.adjacent = null; // This will be an array that stores all adjacent spaces to the current space note that it should always have a lenght of 8 even if a node is on an edge in that case it out of bounds spaces should be null
}

const difficulty = document.getElementById("difficulty");// The dropdown menu
const board = document.getElementById("board");// The main gameboard
const error = document.getElementById("error");// An error message that pops up if the user inputs an invalid board (ex: they put in a board with more mines than spaces)
let started = false; //Gets set to true on assignMines() and set false when clearBoard() is ran
let grid =null; //This will be a 2d array that holds the information for each space
let currentMines = 0; //store the number of mines left for the currrent game only
let gameOver = false; //bool that stores wheather the game has ended (doesn't matter if the game ends in a win or loss)
let time = 0;
let timerId;

difficulty.addEventListener("change", e =>
{
    const selected = difficulty.value; //The selected value from the dropDown menu
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
            else
            {
                console.log("green button clicked");
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
            console.log("flagged");
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
            console.log("unflagged");
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
    [adjacent[3],  current,  adjacent[4]],
    [adjacent[5],adjacent[6],adjacent[7]]

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
    timerId = setInterval(updateTime,1000); //note: don't include the parentheses next to the function name, otherwise it only calls the function once (IDK why)

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

function click(space)
//creates an event that clicks the given space 
//simulates left clicking a space
{
  space.button.dispatchEvent(new Event("click",{bubbles: true, cancelable:true}));// clicks that random space
}

function flag(space)
{
//simulates right clicking a space 
    space.button.dispatchEvent(new Event("contextmenu",{bubbles: true, cancelable: true}));
}

function unFlagEverything()
// Will eventually be used by autosolver to prevent user error 
{
    if(started == true && gameOver == false)
    {
        for(let row = 0; row< grid.length; row++)
        {
            for(let col = 0; col < grid[0].length; col++)
            {
                let current = grid[row][col];
                if(current.flag)// the space has a flag 
                {
                    console.log(`Unflagged grid[${row}${col}]`)
                    flag(current);// removes the flag 
                }
            }
        }
    }
}
function autoSolve()
//The way this functions should work is that it will call logic functions in a loop and each of those functions will return a bool
//if a logic function returns true then it skip the rest and restart the while loop otherwise it will continue to the next logic function
//if all logic functions return false the the while loop will end leaving the game board in its current (likly unfinished) state 
{
    if(started == false)// if no spaces have been clicked then first click a random space
    {
        let rand = grid[Math.floor(Math.random() *grid.length)][Math.floor(Math.random() *grid[0].length)];// selects a random space
        click(rand);// clicks that random space
    }
    unFlagEverything();
    let clicked = true;// Used to represent if a logic function actual did something i.e. click a space or planted a flag
    let count = 0; // counts the number of times the while loop is ran primarily used for debugging
    while(gameOver == false && started ==true && clicked ==true)
    {
        clicked = false;
        count++;
        clicked = logic0(clicked);
        clicked = logic1(clicked);
        clicked = logic2(clicked);
        console.log(`AutoSolve:  ${count}`);
    }
    if(clicked == false)
    {
        console.log("could not complete board");
    }
}
/*
rules for all logic functions:
    •A flag should only be planted if you are 100% sure a spaces has a mine
    •Can only look at numMine of spaces that have already been revealed
    •all logic functions should have a bool as a parmeter and return a bool as well
    •any logic functions that require chance or guess work should only be ran after all
    functions with a guaranteed chance of detecting a mine or free space have been ran

*/
function logic0(clicked)
    // if the number of flags adjacent to the space equals the nunber of mines adjacent to a space then reveal all other spaces adjacent to that space
{
    if(clicked)
    {
        console.log(`logic0 skipped`); // Note if logic0 is skipped then something has gone wrong
        return clicked; // skips this function
    }
    for(let row = 0; row<grid.length; row++)
    {
        for(let col = 0; col<grid[0].length; col++)
        {
            let current = grid[row][col];
            if(current.button.className == "Green" && current.numMine >0)
            {
            let count = getAdjacentFlags(current);
            console.log(`logic0 count: ${count}, numMine: ${current.numMine}`);
            if(count ==current.numMine  &&clickAdjacentSquares(current))
            {
                return true;
            }
            }

        }
    }
    return false;
}
function getAdjacentFlags(space)
//returns the number of adjacent flags from space
//used by logic0
{
    let count = 0;
    for(let i = 0; i< space.adjacent.length; i++)
    {
        if(space.adjacent[i] != null && space.adjacent[i].flag)
        {
            count++;
            console.log("foundFlag")
        }
    }
    return count;
}
function clickAdjacentSquares(space)
//clicks all adjacent squares that don't have a flag and are not already revealed
//used by logic0
{
    let clicked = false;
    for(let i = 0; i<space.adjacent.length; i++)
    {
        let current = space.adjacent[i];
        if(current != null && current.flag ==false && current.button.className == "Blue")
        {
            click(current);
            console.log("clicked");
            clicked = true;
        }
    }
    return clicked; // returns false if no squares were clicked
}

function logic1(clicked)
// if the number of unrevealed spaces next to a space equals the number of adjacent mines then plant a flag at all those spaces
{
    if(clicked)
    {
        console.log(`logic1 skipped`);
        return clicked; // skips this function if logic0 returns true
    }
    for(let row = 0; row<grid.length; row++)
    {
        for(let col = 0; col<grid[0].length; col++)
        {
            let current = grid[row][col];
            if(current.button.className == "Green"&& current.numMine >0)
            {
            let count = getAdjacentUnrevealed(current);
            if(count ==current.numMine && flagAdjacentSquares(current))
            {
                
                return true;
            }
            }

        }
    }
    return false;
}
function getAdjacentUnrevealed(space)
// returns the number of unrevealed spaces adjacent to space
//used by logic1
{
let count = 0;
    for(let i = 0; i< space.adjacent.length; i++)
    {
        if(space.adjacent[i] != null && space.adjacent[i].button.className == "Blue")
        {
            count++;
        }
    }
    return count;
}
function flagAdjacentSquares(space)
//flags all adjacent unrevealed spaces
//returns true if a space is flagged 
//used by logic1
{
    let flagged = false;
   for(let i = 0; i<space.adjacent.length; i++)
    {
        let current = space.adjacent[i];
        if(current != null && current.flag ==false && current.button.className == "Blue")
        {
            flagged = true;
           flag(current);
        }
    }
    return flagged;
}

function logic2(clicked)
// If you find a space there where the number of unrevealed and unflagged spaces are on one side of it and the total number of them equals (numMine - Other already flagged spaces ) + 1 then that means one of those spaces has a mine
//therefore you can use that information to either reveal or flag a space 2 spaces away from the edge depending on numMine of the space, 1 space away form the edge 
/*ex: (S stands for unrevealed square)
________      ________       
S S 1 0       S S 1 0
S S 1 0       S S 1 0
S S 2 1   —>  S 2 2 1 
S S S S       S S S S
 ......   
*/
{
    if(clicked)
    {
        console.log("logic2 skipped");
        return clicked; //skips this function
    }
    console.log("logic2 ran");
    for(let row = 0; row <grid.length; row++)
    {
        for(let col = 0; col<grid[0].length; col++)
        {
            let current = grid[row][col];
            let remaining = current.numMine - getAdjacentFlags(current);// Stores the number of remaining unrevealed and unflagged spaces adjacent to current
            if(current.button.className == "Green" && remaining > 0)
            {
                let side = Corner(current);
                let adj =null;
                let possible = null;
                //format of cases: {middlespace}-{cornerspace}
                switch(side)
                {
                    case "no":
                        break;

                    case "top-left":
                        adj = grid[row][col-1]; 
                        possible = adj.adjacent[0];
                        break;

                    
                    case "top-right":
                        adj = grid[row][col+1]; 
                        possible = adj.adjacent[2];
                        break;
                    case "left-top":
                        adj = grid[row-1][col]; 
                        possible = adj.adjacent[0];
                        break;
                    case "left-bottom":
                        adj = grid[row+1][col]; 
                        possible = adj.adjacent[5];
                        break;

                    case "right-top":
                        adj = grid[row-1][col]; 
                        possible = adj.adjacent[2];
                        break;
                    
                    case "right-bottom":
                        adj = grid[row+1][col]; 
                        possible = adj.adjacent[7];
                        break;

                    case "bottom-left":
                        adj = grid[row][col-1]; //the space to the left
                        possible = adj.adjacent[5];
                        break;
                    case "bottom-right":
                        adj = grid[row][col+1]; //the space to the right
                        possible = adj.adjacent[7];
                        break;
                
                }
                if(adj != null)
                {
                    let remainingAdj = adj.numMine - getAdjacentFlags(adj);
                    if(oneSide(adj))
                    {
                        if(remainingAdj == remaining)// The share the same remaining mines
                        {
                            if(possible.flag == false)
                            {
                                click(possible);
                                console.log(`logic2 clicked${possible}`);
                                return true;
                            }
                        }
                        if(remainingAdj == remaining+1)
                        {
                            if(possible.flag == false)
                            {
                                flag(possible);
                            console.log(`logic2 flagged ${possible}`);
                                return true;
                            }
                        }
                    }
                    else
                    {
                        console.log("oneSide(adj) returned false");
                    }
                }
            
            }

        }
    }
    return false;

}
function Corner(space)
// checks if the only unrevealed and unflagged spaces are a middle and a cornerspace and that those spaces are on the same side
//used by logic2
{
    let count = 0; // counts the number of unreveled and unflagged
    let unrevealed = new Array();
    for(let i = 0; i<space.adjacent.length; i++)
    {
        let current = space.adjacent[i];
        if(current != null && current.flag ==false && current.button.className =="Blue")
        {
            count = unrevealed.push(i);// added the location to unrevealed and increments count
        }
        if(count>2)
        {
            return "no";
        }
    }
    if(count != 2)
    {
        return "no";
    }
    //unrevealed.length must now equal 2

    if(unrevealed.includes(1))
    {
        if(unrevealed.includes(0))
            return "top-left";
        if(unrevealed.includes(2))
            return "top-right";
    }
    if(unrevealed.includes(3))
    {
        if(unrevealed.includes(0))
            return "left-top";
        if(unrevealed.includes(5))
            return "left-bottom";
    }
    if(unrevealed.includes(4))
    {
        if(unrevealed.includes(2))
            return "right-top";
        if(unrevealed.includes(7))
            return "right-bottom";
    }
    if(unrevealed.includes(6))
    {
        if(unrevealed.includes(5))
            return "bottom-left";
        if(unrevealed.includes(7))
            return "bottom-right";
    }
    return "no";
    
}
function oneSide(space)
// checks if all revealed and unflagged spaces are on one side, if they are, then returns which side they are on otherwises returns "no"
//used by logic2
{
    let count = 0; // counts the number of unreveled and unflagged
    let unrevealed = new Array();
    for(let i = 0; i<space.adjacent.length; i++)
    {
        let current = space.adjacent[i];
        if(current != null && current.flag == false  &&current.button.className =="Blue")
        {
            count = unrevealed.push(i);// added the location to unrevealed and increments count
        }
        if(count>3)
        {
            return false;
        }
    }
    if(count != 3)
    {
        return false;
    }
    //unrevealed.length must now equal 3
    if(unrevealed[0] ==0 && unrevealed[1] ==1 && unrevealed[2] == 2)// Only the top spaces are unrevealed and unflagged
    {
        return true;
    }
    if(unrevealed[0] ==0 && unrevealed[1] ==3 && unrevealed[2] == 5)// Only the left spaces are unrevealed and unflagged
    {
        return true;
    }
    if(unrevealed[0] ==2 && unrevealed[1] ==4 && unrevealed[2] == 7)// Only the right spaces are unrevealed and unflagged
    {
        return true;
    }
    if(unrevealed[0] ==5 && unrevealed[1] ==6 && unrevealed[2] == 7)// Only the bottom spaces are unrevealed and unflagged
    {
        return true;
    }
    return false;
    
}

function logic3(clicked)
//simulates placing a mine in an unrevealed and unflagged space that has a revealed space next to it, then tests all possible combinations of mines that could be placed,
//If non of the combintations of mines work with the prexisting flags and numbers then, reveal that space as it cannot have a mine
{
    if(clicked)
    {
        console.log("logic3 skipped");
        return clicked; //skips this function
    }
    console.log("logic3 ran");



}
function getUnrevealed(space)
// checks the adjeacent spaces to space and returns an array of all unrevelaed and unflagged spaces 
// remember to replace get adjacent unvreveled with this function and replace any call to that function with this function .length
{
  let unrevealed = new Array();
  for(let i = 0; i< space.adjacent.length; i++)
    {
        if(space.adjacent[i] != null && space.adjacent[i].button.className == "Blue")
        {
            unrevealed.push(space.adjacent[i])
        }
    }
    return unrevealed;
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
