

/*
	example (from book):

	(define gcd-machine
		(make-machine
			;; register names
			'(a b t) 
			;; opName / op pairs
			(list (list 'rem remainder)
					(list '= =))
			;; instruction list (string?)
			'(test-b
				(test (op =) (reg b) (const 0))
				(branch (label gcd-done))
				(assign t (op rem) (reg a) (reg b))
				(assign a (reg b))
				(assign b (reg t))
				(goto (label test-b))
			gcd-done)))

	machineData is an array consisting of
		> an array of register names,
		> an array of input register names
			(a subset of register names)
		> a designated return register name
			(maybe make that standard?)
		> a dictionary of operation names
			paired with actual functions,
			and
		> the controller text.

	The controller text is in string form
	(written in Lisp style), and it will
	get parsed into JS array format before
	getting passed to the assembler.
*/

// TODO: designate start and return registers

function Machine(machineData) {
	var counter = new Register('counter');
	var flag = new Register('flag');
	var stack = new Stack();

	/* registers */

	var registerNames = machineData[0];
	var inputRegisters = machineData[1];
	var outputRegister = machineData[2];

	var registerTable = 
		{
			'counter' : counter,
			'flag' : flag,
		};

	this.lookupRegister(name) {
		if (name in registerTable) 
			return registerTable.name;
		else
			throw 'Unknown register: ' + name;
	}

	function allocateRegister(name) {
		if (name in registerTable)
			throw name + ' already defined!';
		else
			registerTable[name] = new Register(name);
	}

	// on creation
	registerNames.forEach(function(name) {
		allocateRegister(name);
	});

	this.setInputs(inputs) {
		for (i = 0; i < inputs.length; i++)
			inputRegisters[i].set(inputs[i]);
	}

	this.getOutput() {
		return outputRegister.get();
	}

	/* operations */
	// TODO: sort this out

	var operations = machineData[3];

	var basicOperations = 
		{
			'initializeStack' : 
			function() {stack.initialize();},
		};

	// on creation
	for (opName in basicOperations)
		operations[opName] = basicOperations[opName];

	// install operations?


	/* instructions */

	var controllerText = machineData[4];

	// make assemble a private method?
	var instructions = assemble(controllerText, machine);

	function assemble() {

	}












	/* run */
	// should these all be private? (except for run)
	function execute() {
		// check counter?
		if (instructions.length == 0)
			return 'done!';
		else { // ???
			instructionExecutionFunc(instructions[0]);
			execute();
		}
	}

	this.advanceCounter() {
		counter.set(counter.get().slice(1))
	}

	// private?
	this.start = function() {
		counter.set(instructions);
		execute();
	}

	// inputs should be an array
	// # of inputs should equal # of start regs
	this.run = function(inputs) {
		this.setInputs(inputs);

		this.start();

		return this.getOutput();
	}
}

/* registers */

function Register(name) {
	 var contents = '*unassigned*';

	 this.get = function() {
	 	return contents;
	 }

	 this.set = function(value) {
	 	contents = value;
	 }
}

/* stacks */

function Stack() {
	var contents = [];

	this.push = function(value) {
		contents.unshift(value);
	}

	this.pop = function() {
		if (contents.length == 1)
			throw "Empty stack -- POP";
		else
			return contents.shift();
	}

	this.initialize() {
		contents = [];
		return 'initialized!';
	}
}

/* instructions */
// TODO: parser
function Instruction(text) {
	this.text = parse(text);

	this.type = text[0];

	this.func = function(){};

	this.setFunc = function(func) {
		this.func = func;
	};
}


// TODO
function extractLabels(text, receive) {
	if (text.length == 0)
		return receive([],[]);

	var collector =
		function(instructions, labels) {
			var nextInstruction = text[0];
			if (typeof(nextInstruction) == 'string')
				return ;
			else
				return ;
	};
}

function makeLabelEntry(labelName, instructions) {
	return [labelName, instructions];
}


// move to machine
function makeFunc(instruction, labels, machine) {
	var type = instruction.type;

	if (type == 'assign')
		return makeAssign(instruction, labels, machine);
	if (type == 'test')
		return makeTest(instruction, labels, machine);
	if (type == 'branch')
		return makeBranch(instruction, labels, machine);
	if (type == 'goto')
		return makeGoto(instruction, labels, machine);
	if (type == 'save')
		return makeSave(instruction, machine);
	if (type == 'restore')
		return makeRestore(instruction, machine);
	if (text == 'perform')
		return makePerform(instruction, labels, machine);
	else
		throw 'Unknown instruction type' 
					+ ' -- ASSEMBLE : ' + type;
}








/* expression types */














// functional interface

function pop(stack) {
	return stack.pop();
}

function push(stack, value) {
	stack.push(value);
}

function getContents(register) {
	return register.get();
}

function setContents(register, value) {
	register.set(value);
}

function getRegister(machine, registerName) {
	var register = machine.lookupRegister(registerName);
	return getContents(register);
}

function setRegister(machine, registerName, value) {
	var register = machine.lookupRegister(registerName);
	setContents(register, value);
}

function startMachine(machine) {
	machine.start();
}






















