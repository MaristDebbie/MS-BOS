/* ------------
   CPU.js

   Requires global.js.

   Routines for the host CPU simulation, NOT for the OS itself.
   In this manner, it's A LITTLE BIT like a hypervisor,
   in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
   that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
   JavaScript in both the host and client environments.

   This code references page numbers in the text book:
   Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */

function Cpu() {
	this.PC    = 0;     // Program Counter
	this.Acc   = 0;     // Accumulator
	this.Xreg  = 0;     // X register
	this.Yreg  = 0;     // Y register
	this.Zflag = 0;     // Z-ero flag (Think of it as "isZero".)
	this.isExecuting = false;
}

Cpu.prototype.init = function(processState, isExecuting) {
	// Since JS doesn't have true function overloading, we must handle
	// the possibility of the pcb function argument being passed or not
	if (processState) {
		this.PC    = processState.pcb.pc;
		this.Acc   = processState.pcb.acc;
		this.Xreg  = processState.pcb.xReg;
		this.Yreg  = processState.pcb.yReg;
		this.Zflag = processState.pcb.zFlag;
	} else {
		this.PC    = 0;
		this.Acc   = 0;
		this.Xreg  = 0;
		this.Yreg  = 0;
		this.Zflag = 0;
	}
	if (isExecuting) {
		this.isExecuting = isExecuting;
	} else {
		this.isExecuting = false;
	}
};

Cpu.prototype.cycle = function() {
	krnTrace("CPU cycle");
	// TODO: Accumulate CPU usage and profiling statistics here.
	// Do the real work here. Be sure to set this.isExecuting appropriately.
	_CycleCounter++;
	this.execute(this.fetch());
	printCpuToScreen();
};

Cpu.prototype.fetch = function() {
	return _MemoryManager.getMemoryAtAddress(this.PC);
};

Cpu.prototype.execute = function(instruction) {
	instruction = String(instruction);
	if (instruction === 'A9') {
		this.loadAccumulatorConstant();
	} else if (instruction === 'AD') {
		this.loadAccumulatorFromMemory();
	} else if (instruction === '8D') {
		this.storeAccumulatorInMemory();
	} else if (instruction === '6D') {
		this.addWithCarry();
	} else if (instruction === 'A2') {
		this.loadXConstant();
	} else if (instruction === 'AE') {
		this.loadXFromMemory();
	} else if (instruction === 'A0') {
		this.loadYConstant();
	} else if (instruction === 'AC') {
		this.loadYFromMemory();
	} else if (instruction === 'EA') {
		this.noOperation();
	} else if (instruction === '00') {
		this.break();
	} else if (instruction === 'EC') {
		this.compareToX();
	} else if (instruction === 'D0') {
		this.branchNotEqual();
	} else if (instruction === 'EE') {
		this.increment();
	} else if (instruction === 'FF') {
		this.systemCall();
	} else {
		// Make a software interrupt to handle this unknown opcode
        _KernelInterruptQueue.enqueue(new Interrupt(UNKNOWN_OPCODE_IRQ));
	}
	// Onwards and upwards!
	this.PC++;
};

// LDA
// Load the accumulator with a constant
Cpu.prototype.loadAccumulatorConstant = function() {
	// Get the memory at the next address (increment PC)
	// Translate the value from hex to decimal and store it in the accumulator
	this.Acc = _MemoryManager.translateAddress(_MemoryManager.getMemoryAtAddress(++this.PC));
};

// LDA
// Load the accumulator from memory
Cpu.prototype.loadAccumulatorFromMemory = function() {
	// Load the accumulator with the data from memory
	this.Acc = this.getDataAtNextTwoBytes();
};

// STA
// Store the accumulator in memory
Cpu.prototype.storeAccumulatorInMemory = function() {
	_MemoryManager.putDataAtAddress(this.Acc.toString(16), this.getNextTwoBytes());
};

// ADC
// Add with carry
// Adds contents of an address to the contents of the accumulator
// and keeps the result in the accumulator
Cpu.prototype.addWithCarry = function() {
	this.Acc += _MemoryManager.translateAddress(this.getDataAtNextTwoBytes());
};

// LDX
// Load the X register with a constant
Cpu.prototype.loadXConstant = function () {
	// Get the memory at the next address (increment PC)
	// Translate the value from hex to decimal and store it in the X register
	this.Xreg = _MemoryManager.translateAddress(_MemoryManager.getMemoryAtAddress(++this.PC));
};

// LDX
// Load the X register from memory
Cpu.prototype.loadXFromMemory = function() {
	// Load the X register with the data from memory
	this.Xreg = this.getDataAtNextTwoBytes();
};

// LDY
// Load the Y register with a constant
Cpu.prototype.loadYConstant = function () {
	// Get the memory at the next address (increment PC)
	// Translate the value from hex to decimal and store it in the Y register
	this.Yreg = _MemoryManager.translateAddress(_MemoryManager.getMemoryAtAddress(++this.PC));
};

// LDY
// Load the Y register from memory
Cpu.prototype.loadYFromMemory = function() {
	// Load the Y register with the data from memory
	this.Yreg = this.getDataAtNextTwoBytes();
};

// NOP
// No Operation
Cpu.prototype.noOperation = function() {
	// You really thought there'd be something here?
};

// BRK
// Break (which is really a system call)
Cpu.prototype.break = function() {
	// Update the PCB for this program
	_CurrentProgram.pcb.pc = this.PC;
	_CurrentProgram.pcb.acc = this.Acc;
	_CurrentProgram.pcb.xReg = this.Xreg;
	_CurrentProgram.pcb.yReg = this.Yreg;
	_CurrentProgram.pcb.zFlag = this.Zflag;
	_KernelInterruptQueue.enqueue(new Interrupt(CPU_BREAK_IRQ));
};

// CPX
// Compare a byte in memory to the X reg
// Sets the Z (zero) flag if equal
Cpu.prototype.compareToX = function() {
	// Get the data
	var data = this.getDataAtNextTwoBytes();
	if (parseInt(this.Xreg) === parseInt(data)) {
		this.Zflag = 1;
	} else {
		this.Zflag = 0;
	}
};

// BNE
// Branch X bytes if Z flag = 0
Cpu.prototype.branchNotEqual = function() {
	if (this.Zflag === 0) {
		// We will increment PC to the position at the next byte
		this.PC += _MemoryManager.translateAddress(_MemoryManager.getMemoryAtAddress(++this.PC)) + 1;
		// Check that we haven't gone past our memory limit
		if (this.PC >= PROGRAM_SIZE) {
			// Fix it, if we have
			this.PC -= PROGRAM_SIZE;
		}
	} else {
		// This is a failsafe. If Zflag is not 0, we don't want
		// to evaluate the next byte
		++this.PC;
	}
};

// INC
// Increment the value of a byte
Cpu.prototype.increment = function() {
	// Get the location and the data at that location
	var location = this.getNextTwoBytes(),
		data = _MemoryManager.getMemoryAtAddress(location);
	// Convert from base 16 to 10 so we can increment it
	data = parseInt(data, 16);
	data++;
	// Store the data back as hex
	_MemoryManager.putDataAtAddress(data.toString(16), location);
};

// SYS
// System Call
Cpu.prototype.systemCall = function() {
	// Generate a software interrupt to handle the SYS call.
	_KernelInterruptQueue.enqueue(new Interrupt(SYS_OPCODE_IRQ));
};

// Returns the decimal representation of the next two bytes
Cpu.prototype.getNextTwoBytes = function() {
	// Because of the ordering of certain opcodes, we need to get the next 2 bytes
	// then reverse the order and concatenate them to get the memory address we want.
	var firstByte = _MemoryManager.getMemoryAtAddress(++this.PC),
		secondByte = _MemoryManager.getMemoryAtAddress(++this.PC),
		hex = (secondByte + firstByte),
		decimal = _MemoryManager.translateAddress(hex);
	return decimal;
};

// TODO: Think of a better function name
Cpu.prototype.getDataAtNextTwoBytes = function() {
	// Gets the data at the next two bytes
	return _MemoryManager.getMemoryAtAddress(this.getNextTwoBytes());
};
