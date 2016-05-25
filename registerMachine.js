/*
	TODO:
		~ clean up all the debugging debris
		~ as per SICP exercises, set up a real
			internal debugging/stats system
		~ sort out private/public methods
		~ convert labels to a real dictionary
		~ figure out why installInstructions needs
			to be run every time
		~ tighten up all the inefficeient repetitions
			(eg installInstructions running on 
			two separate instruction lists))
		~ the list of registers is implicit
			in the controllerText, right?
			figure that out
*/

/*
	example (from SICP):

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
			(maybe make that standard?), and
		> the controller text.

	The controller text is in string form
	(written in Lisp style), and it will
	get parsed into JS array format before
	getting passed to the assembler.
*/

var operationsJS = 
	 {
	 	'=' : function(a,b) {return a == b},
	 	'<' : function(a,b) {return a < b},
	 	'+' : function(a,b) {return a + b},
	 	'-' : function(a,b) {return a - b},
	 	'*' : function(a,b) {return a * b},
	 	'rem' : function(a,b) {return a % b},
	 }

var gcdControllerText = '(test-b (test (op =) (reg b) (const 0)) (branch (label gcd-done)) (assign t (reg a)) rem-loop (test (op <) (reg t) (reg b)) (branch (label rem-done)) (assign t (op -) (reg t) (reg b)) (goto (label rem-loop)) rem-done (assign a (reg b)) (assign b (reg t)) (goto (label test-b)) gcd-done)'
//var gcdControllerText = '(test-b (test (op =) (reg b) (const 0)) (branch (label gcd-done)) (assign t (op rem) (reg a) (reg b)) (assign a (reg b)) (assign b (reg t)) (goto (label test-b)) gcd-done)';
var gcdRegisters = ['a','b','t'];
var gcdInputRegisters = ['a','b'];
var gcdOutputRegister = 'a';

var gcdData = 	
	[
		gcdRegisters, 
		gcdInputRegisters, 
		gcdOutputRegister, 
		gcdControllerText
	];

var gcd = new Machine(gcdData);

var factControllerText = '((assign continue (label end)) down (test (op =) (reg n) (const 1)) (branch (label base)) (push continue) (push n) (assign n (op -) (reg n) (const 1)) (assign continue (label up)) (goto (label down)) up (pop n) (pop continue) (assign result (op *) (reg n) (reg result)) (goto (reg continue)) base (assign result (const 1)) (goto (reg continue)) end)'
var factRegisters = ['n', 'result', 'continue'];
var factInputRegisters = ['n'];
var factOutputRegister = 'result';

var factData = 
	[
		factRegisters,
		factInputRegisters,
		factOutputRegister,
		factControllerText
	]

var fact = new Machine(factData);

function Machine(machineData) {
	var machine = this;

	var counter = new Register('counter');
	var flag = new Register('flag');
	var stack = new Stack();

	this.counter = counter;
	this.flag = flag;
	this.stack = stack;

	/* registers */

	var registerNames = machineData[0];
	var inputRegisters = machineData[1];
	var outputRegister = machineData[2];

	var registerTable = 
		{
			'counter' : counter,
			'flag' : flag,
		};
	this.registerTable = registerTable;
	// leave public for debugging
	this.lookupRegister = function(name) {//debugger;
		if (name in registerTable) 
			return registerTable[name];
		else
			throw 'LOOKUP-REGISTER -- ' + 
				'Unknown register: ' + name;
	}

	function allocateRegister(name) {
		if (name in registerTable)
			throw 'register *' + name + 
				'* already defined!';
		else
			registerTable[name] = new Register(name);
	}

	function installRegisters() {
		registerNames.forEach(function(name) {
			allocateRegister(name);
		});
	}

	//installRegisters();

	this.getRegisterContents = function(name) {
		var register = machine.lookupRegister(name);
		return register.contents();
	}

	/* operations */

	var operations = operationsJS;

	// more basic ops can be added later

	// can this be merged into the global operationsJS?
	var basicOperations = 
		{
			'initializeStack' : 
			function() {machine.stack.initialize();},
		};

	function lookupOperation(name) {
		if (name in operations)
			return operations[name];
		else
			throw 'LOOKUP-OPERATION -- ' +
				'Unknown operation : ' + name;
	}

	// is this needed?
	function installOperations() {
		for (opName in basicOperations){
			operations[opName] = basicOperations[opName];
		}
	}


	/* instructions */

	/*
		major instruction manipulation functions
		defined outside of machine:
			~ parse
			~ assemble
	*/

	var controllerText = machineData[3];
	var parsedText = parse(controllerText);
	var assembledText = assemble(parsedText);
	var instructions = assembledText[0];
	var labels = assembledText[1];

	this.instructions = instructions;
	this.labels = labels;

	//debugger;

	function installInstructions() {
		instructions.forEach(function(instruction) {//debugger;
			var executionFunc = 
				makeFunc(instruction);
			instruction.setFunc(executionFunc);
		});

		var labels = machine.labels;
		//debugger;

		labels.forEach(function(label) {
			var assInsts = label[1];
			assInsts.forEach(function(instruction) {
				var executionFunc =
					makeFunc(instruction);
				instruction.setFunc(executionFunc);
			});
		});
	}

	// this assumes labels is set up as a array pairs,
	// rather than a proper dictionary
	function lookupLabel(labelName) {
		for (i = 0; i < labels.length; i++) {//debugger;
			var entry = labels[i];
			var label = entry[0];
			var destination = entry[1];
			if (label == labelName)
				return destination; 
		}

		throw 'Undefined label: ' + labelName;

		/*
		// this should work for a real dictionary
		for (entry in labels) {
			if (entry[0] == labelName)
				return entry[1];
			else
				throw 'Undefined label: ' + labelName;
		}
		*/
	}

	/* instruction functions */

	function makeFunc(instruction) {//debugger;
		var type = instruction.type;

		if (type == 'assign')
			return makeAssign(instruction);
		if (type == 'test')
			return makeTest(instruction);
		if (type == 'branch')
			return makeBranch(instruction);
		if (type == 'goto')
			return makeGoto(instruction);
		if (type == 'push')
			return makePush(instruction);
		if (type == 'pop')
			return makePop(instruction);
		if (type == 'perform')
			return makePerform(instruction);
		else
			throw 'Unknown instruction type' +
						' -- makeFunc : ' + 
							instruction;
	}

	function throwError(instructionType) {
		throw 'ASSEMBLE -- bad ' +
				instructionType +
				' instruction';
	} 

	function makeAssign(instruction) {//debugger;
		var targetName = instruction.assignRegName;
		var target = machine.lookupRegister(targetName);
		var valueExp = instruction.assignValueExp;
		var valueFunc = operationExp(valueExp) ?
						makeOperationExp(valueExp) :
						makePrimitiveExp(valueExp[0]);
		return function() {
			target.set(valueFunc());
			//advanceCounter();
			machine.advanceCounter();
		};
	}

	function makeTest(instruction) {//debugger;
		var condition = instruction.testCondition;
		if (!operationExp(condition))
			throwError('TOAST');
		var conditionFunc = 
			makeOperationExp(condition);
		return function() {
			machine.flag.set(conditionFunc());
			//advanceCounter();
			machine.advanceCounter();
		}
	}

	function makeBranch(instruction) {
		var destination = instruction.destination;
		if (!labelExp(destination))
			throwError('BRUNCH');
		var label = labelExpLabel(destination);
		var destInstructions = lookupLabel(label);
		return function() {
			if (machine.flag.contents())
				machine.counter.set(destInstructions);
			else
				//advanceCounter();
				machine.advanceCounter();
		};
	}

	function makeGoto(instruction) {
		var destination = instruction.destination;
		if (labelExp(destination)) {
			var label = labelExpLabel(destination);
			var destInstructions = lookupLabel(label);
			return function() {
				machine.counter.set(destInstructions);
			}
		}
		if (registerExp(destination)) {
			var registerName =
				regExpRegister(destination);
			var register = 
				machine.lookupRegister(registerName);
			return function() {
				machine.counter.set(register.contents());
			}
		}
		else throwError('GOOT')
	}

	function makePush(instruction) {//debugger;
		var stackInstRegName = 
			instruction.stackInstRegName;
		var register =
			machine.lookupRegister(stackInstRegName);
		return function() {
			machine.stack.pushIt(register.contents());
			machine.advanceCounter();
		};
	}

	function makePop(instruction) {
		var stackInstRegName = 
			instruction.stackInstRegName;
		var register =
			machine.lookupRegister(stackInstRegName);
		return function() {
			register.set(stack.popIt());
			machine.advanceCounter();
		}
	}

	function makePerform(instruction) {
		var action = instruction.action;
		if (!operationExp(action))
			throwError('PERFROM');
		var actionFunc = makeOperationExp(action);
		return function() {
			actionFunc();
			//advanceCounter();
			machine.advanceCounter();
		}
	}

	function advanceCounter() {
		counter.set(counter.contents().slice(1));
	}

	this.advanceCounter = function() {
		machine.counter.set(machine.counter.contents().slice(1));
		//console.log('counter advanced!');
	}

	/* subexpression functions */

	function makePrimitiveExp(expression) {//debugger;
		if (constantExp(expression)) {
			var constant = 
				constExpConstant(expression);
			return function() {
				return constant;
			};
		}
		else if (labelExp(expression)) {//debugger;
			var label = labelExpLabel(expression);
			var labelInstructions = 
				lookupLabel(label);
			return function() {
				return labelInstructions;
			};
		}
		else if (registerExp(expression)) {//debugger;
			var registerName = 
				regExpRegister(expression);
			var register = 
				machine.lookupRegister(registerName);
			return function() {
				return register.contents();
			};
		}
		else throw 'makePrimitiveExp -- ' + 
			'Unknown expression type' + expression;
	}

	function makeOperationExp(expression) {//debugger;
		var registerTable = machine.registerTable;
		var operationName = 
			opExpOperation(expression);
		var operation = 
			lookupOperation(operationName);
		var operands = opExpOperands(expression);
		var aprocs = operands.map(makePrimitiveExp);
		var aprocsExecuted = 
			aprocs.map(function(f){return f();});
		return function() {
			return operation.apply(null,aprocsExecuted);
		};
	}

	/* installation */

	installRegisters();
	installOperations();
	//installInstructions();

	/* run */

	function execute() {
		installInstructions();
		var docket = counter.contents();
		//console.log(docket);
		if (docket.length == 0) {
			//console.log('done!');
			return;
		}
		var instruction = docket[0];
		//console.log(instruction.funcText());debugger;
		instruction.executeFunc();
		// console.log(registerTable['n'].contents());
		// console.log(registerTable['result'].contents());
		// console.log(registerTable['continue'].contents());
		// console.log(stack.contents);
		// console.log(flag.contents());
		// console.log(counter.contents());
		execute();
	}

	// private?
	this.start = function() {
		counter.set(instructions);
		execute();
	}

	this.setInputs = function(inputs) {//debugger;
		for (i = 0; i < inputs.length; i++){
			var input = inputs[i];
			var registerName = inputRegisters[i];
			var register = machine.lookupRegister(registerName);
			register.set(input);
		}
		return 'inputs set!';
	}

	this.output = function() {
		return this.lookupRegister(outputRegister).contents();
	}

	// # of inputs should equal # of start regs
	this.run = function(inputs) {//debugger;
		var args = Array.prototype.slice.call(arguments);
		machine.setInputs(args);
		machine.start();
		return machine.output();
	}
}


/* registers */

function Register(name) {
	 var contents = 'unassigned';
	 this.contents = contents;

	 this.name = name;

	 this.contents = function() {
	 	return contents;
	 }

	 this.set = function(value) {
	 	contents = value;
	 }
}

/* stacks */

function Stack() {
	var contents = [];
	this.contents = contents;

	this.pushIt = function(value) {
		contents.unshift(value);
		return 'push it! push it good!';
	}

	this.popIt = function() {
		if (contents.length < 1)
			throw "Empty stack -- POP";
		else
			return contents.shift();
	}

	this.initialize = function() {
		contents = [];
		return 'initialized!';
	}
}

/* instructions and assembler */

function Instruction(text) {//debugger;
	this.text = text; // an array, not actual text
	var text = this.text;

	// instruction types
	this.type = text[0];
	var type = this.type;

	if (type == 'assign') {
		this.assignRegName = text[1];
		this.assignValueExp = text.slice(2); // slice???
	}

	if (type == 'test') {
		this.testCondition = text.slice(1); // slice???
	}

	if (type == 'branch' || type == 'goto') {
		this.destination = text[1];
	}

	if (type == 'push' || type == 'pop') {
		this.stackInstRegName = text[1];
	}

	if (type == 'perform') {
		this.action = text.slice(1);
	}

	// execution function (dummy initially)
	var func = function(){};
	this.func = func;
	this.funcText = function() {
		return func + '';
	}

	this.setFunc = function(f) {
		func = f;
	};

	this.executeFunc = function() {
		func();
	}

}

// labels should be arranged as a real dictionary,
// not array pairs (TODO)
// TODO: fix aliasing
function assemble(text) {
	if (text.length == 0)
		return [ [], [] ];

	// will this recursion be a problem?
	var result = assemble(text.slice(1)); //debugger;
	var instructions = result[0];
	var labels = result[1];
	var nextInstruction = text[0];

	// if nextInstruction is a label
	if (typeof(nextInstruction) == 'string') {
		var instructionsCopy = copyInstructions(instructions)
		var entry = [nextInstruction, instructionsCopy];
		labels.unshift(entry);
		return [instructions, labels];
	}

	// if nextInstruction is an instruction
	else {
		var instruction = 
			new Instruction(nextInstruction);
		instructions.unshift(instruction);
		return [instructions, labels];
	}
}

function copyInstructions(instructions) {
	var result = [];
	for (i = 0; i < instructions.length; i++) {
		var instruction = instructions[i];
		var text = instruction.text;
		var instructionCopy = new Instruction(text);
		result.push(instructionCopy);
		// can instruction aliasing be exploited
		// to avoid copying twice?
		//result.push(instruction);
	}
	return result;
}


/* expression types (low-level helpers) */

function registerExp(expression) {
	return expression[0] == 'reg';
}

function regExpRegister(expression) {
	return expression[1];
}

function constantExp(expression) {
	return expression[0] == 'const';
}

function constExpConstant(expression) {
	return expression[1];
}

function labelExp(expression) {
	return expression[0] == 'label';
}

function labelExpLabel(expression) {
	return expression[1];
}

function operationExp(expression) {
	return expression.length >= 2 &&
		expression[0][0] == 'op';
}

function opExpOperation(expression) {
	return expression[0][1];
}

function opExpOperands(expression) {
	return expression.slice(1);
}

/* parser
	(translated from Peter Norvig's 
	Lispy lisp interpreter) 
*/

function parse(text) {

	return readTokens(tokenize(text));

	function readTokens(tokens) {
		if (tokens.length == 0) return [];
		var token = tokens.shift();
		if (token == '(') {
			var result = [];
			while (tokens[0] != ')')
				result.push(readTokens(tokens));
			tokens.shift();
			return result;
		}
		else if (token == ')') throw 'unexpected )';
		else return atom(token);
	}

	function tokenize(chars) {
		var tokens = 
			chars.replace(/[(]/g, ' ( ').
				replace(/[)]/g, ' ) ').
					split(' ');
		function emptyStringFilter(token) {
			return token != '';
		}
		return tokens.filter(emptyStringFilter);
	}

	function atom(token) {
		var test = token - 0;
		if (isNaN(test)) return token;
		else return test;
	}
}


