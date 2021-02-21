/**
 * operation-span-trial plugin
 * Brett Feltmate
 *
 * Responsible for presenting all trial events, collecting responses, and writing trial data.
 *
 * if practice is set to either 'equations' or 'span', only an equation, or memory item, respectively, are presented.
 * */


jsPsych.plugins['operation-span-trial'] = (function() {
	/*
	* I spent a lot of time mulling over whether this was confusing, still don't know the answer, but:
	*
	* trial_info: object which stores relevant data (to the researcher), and eventually is what gets written as the data output.
	* plugin properties/methods access values from trial_info to inform the creation of DOM elements (which the researcher is NOT interested in, despite what jsPsych thinks)
	*
	* This can be confusing because sometimes you'll see plugin properties/methods accessing  trial.some_parameter_arg ,  these usually are cases
	* where parameter values passed as trial args need to be modified before assigning to trial_info, and in other cases are needed by the plugin, but are not necessary to store in trial_info.
	* */
	var trial_info = {};
	var plugin = {};

	// we want to pre-load media; the arguments here are plug-in name, plug-in parameter, media-type
	// jsPsych.pluginAPI.registerPreload('operation-span-trial', 'memory_item', 'image');
	// jsPsych.pluginAPI.registerPreload('operation-span-trial', 'memory_items_full', 'image');

	plugin.info = {
		name: 'operation-span-trial',
		parameters: {
			practice: {
				type: jsPsych.plugins.parameterType.STRING,
				pretty_name: "practice",
				default: null,
				description: "Indicates whether this is a practice trial (yes/no)"
			},
			practice_type: {
				type: jsPsych.plugins.parameterType.STRING,
				pretty_name: "practice_type",
				default: null,
				description: "Indicates what type (span, equations) of practice trial is to be presented."
			},
			is_recall_trial: {
				type: jsPsych.plugins.parameterType.BOOL,
				pretty_name: 'is recall trial',
				default: null,
				description: "If true, this trial will end with a recall event"
			},
			equation: {
				type: jsPsych.plugins.parameterType.STRING,
				pretty_name: 'equation',
				default: null,
				description: "Mathematical equation (string) to be evaluated by user"
			},
			equation_duration: {
				type: jsPsych.plugins.parameterType.INT,
				pretty_name: 'equation duration',
				default: 10000,
				description: "Duration to listen for user responses before event self-terminates. Value is conditionally changed as a function of performance during practice trials."
			},
			probe_validity: {
				type: jsPsych.plugins.parameterType.STRING,
				pretty_name: 'probe validity',
				default: null,
				description: "Should probe (proposed solution) be congruent (correct) or incongruent (incorrect)"
			},
			memory_item: {
				type: jsPsych.plugins.parameterType.IMAGE,
				pretty_name: 'Memory item',
				default: null,
				description: 'The memory item presented for later recall.'
			},
			memory_item_duration: {
				type: jsPsych.plugins.parameterType.INT,
				pretty_name: "Memory item duration",
				default: 800,
				description: "How long to present memory item before trial terminates, in ms."
			},
			memory_items_presented: {
				type: jsPsych.plugins.parameterType.OBJECT,
				pretty_name: 'memory items, presented',
				default: {},
				description: "An obj containing the set of image names & paths presented this block"
			},
			memory_items_full: {
				type: jsPsych.plugins.parameterType.OBJECT,
				pretty_name: 'memory items, full set',
				default: {},
				description: 'An obj containing the full set of candidate image names & paths.'
			},
			set_num: {
				type: jsPsych.plugins.parameterType.INT,
				pretty_name: 'set number',
				default: null,
				description: "Numerical index of the current set, respective to the number of sets to be presented for the current block."
			},
			set_size: {
				type: jsPsych.plugins.parameterType.INT,
				pretty_name: "set size",
				default: null,
				description: "Number of items (i.e., trials) in the current set"
			},
			set_index: {
				type: jsPsych.plugins.parameterType.INT,
				pretty_name: 'set index',
				default: null,
				description: 'Numerical index of the current item in the current set size.'
			}
		}
	};

	plugin.set_trial_properties = function(trial) {
		pr('set_trial_properties()')
		trial_info = obj_left_join(data_template, trial)

		plugin.present_equation = false
		plugin.present_memory_item = false
		// plugin.present_equation = (trial_info.practice_type !== 'span');
		// plugin.present_memory_item = (trial_info.practice_type !== 'equation')
		plugin.present_recall = trial.is_recall_trial;



		if (plugin.present_equation) {
			trial_info.equation = (trial_info.practice_type === 'equation') ? trial_info.equation : plugin.extend_equation(trial_info.equation);
			trial_info.probe = plugin.get_probe_value(trial_info.equation, trial_info.probe_validity)
		}

		if (plugin.present_recall) {
			plugin.recall_selections = [];
			plugin.recall_count = 1;
			plugin.memory_items_full = trial.memory_items_full
			plugin.memory_items_presented = trial.memory_items_presented

			pr(plugin.memory_items_full, 'items full')
		}

		plugin.stimuli = {
			'equation': (plugin.present_equation) ? plugin.spawn_equation_element(trial_info.equation) : null ,
			'probe': (plugin.present_equation) ? plugin.spawn_probe_element(trial_info.probe) : null,
			'memory_item': (plugin.present_memory_item) ? plugin.spawn_memory_item_element(trial_info.memory_item) : null,
			'recall': (plugin.present_recall) ? plugin.spawn_recall_elements(plugin.memory_items_full) : null,
		}

		plugin.buttons = {
			'equation': (plugin.present_equation) ? plugin.spawn_button_bank('equation') : null,
			'probe': (plugin.present_equation) ? plugin.spawn_button_bank('probe') : null,
			'recall': (plugin.present_recall) ? plugin.spawn_button_bank('recall') : null
		}

		plugin.prompts = {
			'equation': (plugin.present_equation) ? plugin.spawn_prompt_element('equation') : null,
			'probe': (plugin.present_equation) ? plugin.spawn_prompt_element('probe') : null,
			'memory_item': (plugin.present_memory_item) ? plugin.spawn_prompt_element('memory_item') : null,
			'recall': (plugin.present_recall) ? plugin.spawn_prompt_element('recall') : null
		}


	}

	plugin.click_handler = function(e) {
		pr('click_handler()')
		e.stopPropagation();

		if (! $(this).hasClass('selected')) {
			// label as being selected
			$(this).addClass('selected')
			// Add selection number
			$(this).children('.text-item').text(`${plugin.recall_count}`);
			$(this).children('.image-item').addClass('selected')

			// grab image selected, append to recall bank
			img_key = $(this).children('.image-item').data('key')
			img_choice = $('<div />').addClass('operation-span-recall-item').css('background-image', `url('${plugin.memory_items_full[img_key]}')`)
			$('.operation-span-recall-bank').append(img_choice)

			plugin.recall_selections.push(img_key)
			plugin.recall_count += 1;
		}
	}

	plugin.button_handler = function (e) {
		e.stopPropagation();

		let pressed = $(this).attr('id');
		pr('button_handler({0})'.format(pressed))
		switch(pressed) {
			case 'equation_continue':
				plugin.response_stop_time = performance.now();
				plugin.response_made = true;
				plugin.populate_display('probe');
				break;
			case 'recall_confirm':
				plugin.response_stop_time = performance.now();
				plugin.response_made = true;
				plugin.log_performance('recall')
				break;
			case 'probe_yes':
			case 'probe_no':
				plugin.probe_response = pressed;
				$('.operation-span-button').removeClass('selected')
				$('#'+pressed).addClass('selected')
				break;
			case 'probe_confirm':
				if (plugin.probe_response !== null) {
					plugin.response_stop_time = performance.now();
					plugin.response_made = true;
				}
				break;
			case 'recall_skip':
				$('.operation-span-recall-bank').append($('<div >').addClass('operation-span-recall-item skip'))
				plugin.recall_count += 1;
				plugin.recall_selections.push('skip')
				break;
			case 'recall_clear':
				$('#trial_display').find('.selected').removeClass('selected')
				$('.recall-index').empty();
				$('.operation-span-recall-bank').empty();
				plugin.recall_count = 1;
				plugin.recall_selections = [];
				break;
		}
	}

	plugin.extend_equation = function(equation) {
		pr('extend_equation()')
		let operand = ranged_random(-9, 9);
		let result = evaluateAsFloat(`${equation} + ${operand}`);
		while (result <= 0 || operand === 0 ) {
			operand += 3;
			result = evaluateAsFloat(`${equation} + ${operand}`);
		};

		let operator = (operand < 0) ? '-' : '+';
		return `${equation} {0} {1}`.format(operator, Math.abs(operand))
	}

	plugin.get_probe_value = function(validity) {
		pr('get_probe_value()')
		let solution_actual = evaluateAsFloat(trial_info.equation)
		if (validity === 'congruent') {
			return  solution_actual;
		} else {
			adjustment = ranged_random(-9, 9);
			let proposed_solution = solution_actual + adjustment;
			while (proposed_solution <= 0 || proposed_solution === solution_actual) {
				adustment += 2
				proposed_solution = solution_actual + adjustment
			}
			return proposed_solution
		}
	}

	plugin.spawn_equation_element = function(equation) {
		pr('spawn_equation_element()')
		let equation_text = equation.replace('*', 'x').replace('/', '÷') + ' = ?';

		return $('<div />').addClass('operation-span-single-item text-item').append(
			$('<p />').text(equation_text)
		).attr('id', 'equation_element')
	}

	plugin.spawn_probe_element = function(probe) {
		pr('spawn_probe_element()')
		let probe_item = $('<p >').text(probe);
		return $('<div />').addClass('operation-span-single-item text-item').append(
			probe_item
		).attr('id', 'probe_element')
	}

	plugin.spawn_prompt_element = function(event_type) {
		pr('spawn_prompt_element')

		prompts = {
			'equation': "Press continue when you know the answer.",
			'probe':  "Is this the correct answer? Press confirm when done.",
			'memory_item': "test",
			'recall': "Select the images in the order presented. Press skip for forgotten items, clear to begin again, and confirm once done."
		}

		return $('<div />').addClass('text-item prompt').html(prompts[event_type])
	}

	plugin.spawn_button_bank = function(event_type) {
		pr('spawn_button_bank()')
		button_labels = {
			'equation': ['continue'],
			'probe': ['yes', 'no', 'confirm'],
			'recall': ['skip', 'clear', 'confirm']
		}
		labels = button_labels[event_type];

		let buttons = [];
		labels.forEach(function(label) {
			button_id = event_type + '_' + label.replace(' ', '_')
			buttons.push($('<div />').addClass('operation-span-button').attr('id',  button_id).html(label))
		})

		return $('<div />').addClass('operation-span-button-bank').append(buttons)

	}

	plugin.spawn_memory_item_element = function(memory_item) {
		pr('spawn_memory_item_elements()')
		let memory_stim = $('<div />').addClass('image-item').css('background-image', `url('${memory_item}')`)
		return $('<div />').addClass('operation-span-single-item').append(
			memory_stim
		).attr('id', 'memory_item_element')
	}

	plugin.spawn_recall_elements = function(memory_items_full) {
		pr('spawn_recall_elements()')
		let array_elements = [];

		for (var key of Object.keys(memory_items_full)) {
			let cell = $('<div />').addClass('operation-span-recall-item');
			let cell_contents = [];

			cell_contents.push(
				$('<div />').addClass('text-item recall-index'),
				$('<div />').addClass('image-item recall-image').css('background-image', `url('${memory_items_full[key]}')`).data('key', key)
			)

			$(cell).append(cell_contents)
			array_elements.push(cell)
		}

		let recall_array = $('<div />').addClass('operation-span-recall-array').append(
			array_shuffle(array_elements)
		).attr('id', 'recall_array_element')

		let recall_bank = $('<div />').addClass('operation-span-recall-bank').attr('id', 'recall_bank')

		return [recall_bank, recall_array]
	}

	plugin.populate_display = function(event_type) {
		pr('populate_display()')

		let prompt = plugin.prompts[event_type]
		let buttons = plugin.buttons[event_type]
		let stimulus = plugin.stimuli[event_type]

		let to_append = [prompt, buttons]
		if (is_array(stimulus)) {
			stimulus.forEach(function(item) {
				to_append.push(item)
			})
		} else {to_append.push(stimulus)}

		$('#trial_display').empty().append(to_append)
	}

	plugin.log_performance = function(event_type) {
		if (event_type !== 'memory_item') {
			let event_rt = event_type + '_rt';
			trial_info[event_rt] = (plugin.response_made) ? plugin.response_stop_time - plugin.response_start_time : 'timeout';
		}
		if (event_type === 'probe') {
			trial_info.probe_response = plugin.probe_response;
			switch(trial_info.probe_validity) {
				case 'congruent':
					trial_info.probe_error = trial_info.probe_response === 'no';
					break;
				case 'incongruent':
					trial_info.probe_error = trial_info.probe_response === 'yes';
					break;
			}
		}
		if (event_type === 'recall') {


			let imgs_presented = obj_keys(plugin.memory_items_presented)
			pr(imgs_presented, 'imgs_presented')
			pr(plugin.recall_selections, 'recall_selections')
			trial_info.recall_order = plugin.recall_selections;
			trial_info.recall_partial_score = count_matches(imgs_presented, plugin.recall_selections)
			trial_info.recall_absolute_score = (trial_info.recall_partial_score === imgs_presented.length) ? imgs_presented.length : 0;
			pr(trial_info)
		}
	}

	plugin.trial = function(display_element, trial) {
		pr('trial()')
		$('#jspsych-loading-progress-bar-container').remove();
		plugin.set_trial_properties(trial)

		$('body')
			.on('click', '.operation-span-button', plugin.button_handler)
			.on('click', '.operation-span-recall-item', plugin.click_handler);

		$(display_element).append(
			$('<div />').addClass('operation-span-layout')
				.attr('id', 'trial_display')
		)

		plugin.populate_display('recall')
		plugin.response_start_time = performance.now()




	};

	return plugin;
})();

