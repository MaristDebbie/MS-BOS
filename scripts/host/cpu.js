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

Cpu.prototype.init = function() {
	this.PC    = 0;
	this.Acc   = 0;
	this.Xreg  = 0;
	this.Yreg  = 0;
	this.Zflag = 0;
	this.isExecuting = false;
}

Cpu.prototype.cycle = function() {
	krnTrace("CPU cycle");
	// TODO: Accumulate CPU usage and profiling statistics here.
	// Do the real work here. Be sure to set this.isExecuting appropriately.
};

Cpu.prototype.fetch = function() {
	return _MemoryManager.getMemoryAtAddress(this.PC);
}

Cpu.prototype.execute = function(instruction) {
	if (instruction == 'A9') {
		// LDA
		// Load the accumulator with a constant
	} else if (instruction == 'AD') {
		// LDA
		// Load the accumulator from memory
	} else if (instruction == '8D') {
		// STA
		// Store the accumulator in memory
	} else if (instruction == '6D') {
		// ADC
		// Add with carry
	} else if (instruction == 'A2') {
		// LDX
		// Load the X register with a constant
	} else if (instruction == 'AE') {
		// LDX
		// Load the X register from memory
	} else if (instruction == 'A0') {
		// LDY
		// Load the Y register with a constant
	} else if (instruction == 'AC') {
		// LDY
		// Load the Y register from memory
	} else if (instruction == 'EA') {
		// NOP
		// No Operation
	} else if (instruction == '00') {
		// BRK
		// Break (which is really a system call)
	} else if (instruction == 'EC') {
		// CPX
		// Compare a byte in memory to the X reg
		// Sets the Z (zero) flag if equal
	} else if (instruction == 'D0') {
		// BNE
		// Branch X bytes if Z flag = 0
	} else if (instruction == 'EE') {
		// INC
		// Increment the value of a byte
	} else if (instruction == 'FF') {
		// SYS
		// System Call
	} else {
		// TODO: Error handling
	}
}
