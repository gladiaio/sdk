/*
 * This file is auto-generated. Do not edit manually.
 * Generated from OpenAPI schema.
 */

package live

import "encoding/json"

// Shared Types Types
type LiveV2Encoding string

const (
	LiveV2EncodingWavPcm  LiveV2Encoding = "wav/pcm"
	LiveV2EncodingWavAlaw LiveV2Encoding = "wav/alaw"
	LiveV2EncodingWavUlaw LiveV2Encoding = "wav/ulaw"
)

type LiveV2BitDepth int

const (
	LiveV2BitDepth8  LiveV2BitDepth = 8
	LiveV2BitDepth16 LiveV2BitDepth = 16
	LiveV2BitDepth24 LiveV2BitDepth = 24
	LiveV2BitDepth32 LiveV2BitDepth = 32
)

type LiveV2SampleRate int

const (
	LiveV2SampleRate8000  LiveV2SampleRate = 8000
	LiveV2SampleRate16000 LiveV2SampleRate = 16000
	LiveV2SampleRate32000 LiveV2SampleRate = 32000
	LiveV2SampleRate44100 LiveV2SampleRate = 44100
	LiveV2SampleRate48000 LiveV2SampleRate = 48000
)

type LiveV2Model string

const (
	LiveV2ModelSolaria1 LiveV2Model = "solaria-1"
)

type LiveV2TranscriptionLanguageCode string

const (
	LiveV2TranscriptionLanguageCodeAf  LiveV2TranscriptionLanguageCode = "af"
	LiveV2TranscriptionLanguageCodeAm  LiveV2TranscriptionLanguageCode = "am"
	LiveV2TranscriptionLanguageCodeAr  LiveV2TranscriptionLanguageCode = "ar"
	LiveV2TranscriptionLanguageCodeAs  LiveV2TranscriptionLanguageCode = "as"
	LiveV2TranscriptionLanguageCodeAz  LiveV2TranscriptionLanguageCode = "az"
	LiveV2TranscriptionLanguageCodeBa  LiveV2TranscriptionLanguageCode = "ba"
	LiveV2TranscriptionLanguageCodeBe  LiveV2TranscriptionLanguageCode = "be"
	LiveV2TranscriptionLanguageCodeBg  LiveV2TranscriptionLanguageCode = "bg"
	LiveV2TranscriptionLanguageCodeBn  LiveV2TranscriptionLanguageCode = "bn"
	LiveV2TranscriptionLanguageCodeBo  LiveV2TranscriptionLanguageCode = "bo"
	LiveV2TranscriptionLanguageCodeBr  LiveV2TranscriptionLanguageCode = "br"
	LiveV2TranscriptionLanguageCodeBs  LiveV2TranscriptionLanguageCode = "bs"
	LiveV2TranscriptionLanguageCodeCa  LiveV2TranscriptionLanguageCode = "ca"
	LiveV2TranscriptionLanguageCodeCs  LiveV2TranscriptionLanguageCode = "cs"
	LiveV2TranscriptionLanguageCodeCy  LiveV2TranscriptionLanguageCode = "cy"
	LiveV2TranscriptionLanguageCodeDa  LiveV2TranscriptionLanguageCode = "da"
	LiveV2TranscriptionLanguageCodeDe  LiveV2TranscriptionLanguageCode = "de"
	LiveV2TranscriptionLanguageCodeEl  LiveV2TranscriptionLanguageCode = "el"
	LiveV2TranscriptionLanguageCodeEn  LiveV2TranscriptionLanguageCode = "en"
	LiveV2TranscriptionLanguageCodeEs  LiveV2TranscriptionLanguageCode = "es"
	LiveV2TranscriptionLanguageCodeEt  LiveV2TranscriptionLanguageCode = "et"
	LiveV2TranscriptionLanguageCodeEu  LiveV2TranscriptionLanguageCode = "eu"
	LiveV2TranscriptionLanguageCodeFa  LiveV2TranscriptionLanguageCode = "fa"
	LiveV2TranscriptionLanguageCodeFi  LiveV2TranscriptionLanguageCode = "fi"
	LiveV2TranscriptionLanguageCodeFo  LiveV2TranscriptionLanguageCode = "fo"
	LiveV2TranscriptionLanguageCodeFr  LiveV2TranscriptionLanguageCode = "fr"
	LiveV2TranscriptionLanguageCodeGl  LiveV2TranscriptionLanguageCode = "gl"
	LiveV2TranscriptionLanguageCodeGu  LiveV2TranscriptionLanguageCode = "gu"
	LiveV2TranscriptionLanguageCodeHa  LiveV2TranscriptionLanguageCode = "ha"
	LiveV2TranscriptionLanguageCodeHaw LiveV2TranscriptionLanguageCode = "haw"
	LiveV2TranscriptionLanguageCodeHe  LiveV2TranscriptionLanguageCode = "he"
	LiveV2TranscriptionLanguageCodeHi  LiveV2TranscriptionLanguageCode = "hi"
	LiveV2TranscriptionLanguageCodeHr  LiveV2TranscriptionLanguageCode = "hr"
	LiveV2TranscriptionLanguageCodeHt  LiveV2TranscriptionLanguageCode = "ht"
	LiveV2TranscriptionLanguageCodeHu  LiveV2TranscriptionLanguageCode = "hu"
	LiveV2TranscriptionLanguageCodeHy  LiveV2TranscriptionLanguageCode = "hy"
	LiveV2TranscriptionLanguageCodeId  LiveV2TranscriptionLanguageCode = "id"
	LiveV2TranscriptionLanguageCodeIs  LiveV2TranscriptionLanguageCode = "is"
	LiveV2TranscriptionLanguageCodeIt  LiveV2TranscriptionLanguageCode = "it"
	LiveV2TranscriptionLanguageCodeJa  LiveV2TranscriptionLanguageCode = "ja"
	LiveV2TranscriptionLanguageCodeJw  LiveV2TranscriptionLanguageCode = "jw"
	LiveV2TranscriptionLanguageCodeKa  LiveV2TranscriptionLanguageCode = "ka"
	LiveV2TranscriptionLanguageCodeKk  LiveV2TranscriptionLanguageCode = "kk"
	LiveV2TranscriptionLanguageCodeKm  LiveV2TranscriptionLanguageCode = "km"
	LiveV2TranscriptionLanguageCodeKn  LiveV2TranscriptionLanguageCode = "kn"
	LiveV2TranscriptionLanguageCodeKo  LiveV2TranscriptionLanguageCode = "ko"
	LiveV2TranscriptionLanguageCodeLa  LiveV2TranscriptionLanguageCode = "la"
	LiveV2TranscriptionLanguageCodeLb  LiveV2TranscriptionLanguageCode = "lb"
	LiveV2TranscriptionLanguageCodeLn  LiveV2TranscriptionLanguageCode = "ln"
	LiveV2TranscriptionLanguageCodeLo  LiveV2TranscriptionLanguageCode = "lo"
	LiveV2TranscriptionLanguageCodeLt  LiveV2TranscriptionLanguageCode = "lt"
	LiveV2TranscriptionLanguageCodeLv  LiveV2TranscriptionLanguageCode = "lv"
	LiveV2TranscriptionLanguageCodeMg  LiveV2TranscriptionLanguageCode = "mg"
	LiveV2TranscriptionLanguageCodeMi  LiveV2TranscriptionLanguageCode = "mi"
	LiveV2TranscriptionLanguageCodeMk  LiveV2TranscriptionLanguageCode = "mk"
	LiveV2TranscriptionLanguageCodeMl  LiveV2TranscriptionLanguageCode = "ml"
	LiveV2TranscriptionLanguageCodeMn  LiveV2TranscriptionLanguageCode = "mn"
	LiveV2TranscriptionLanguageCodeMr  LiveV2TranscriptionLanguageCode = "mr"
	LiveV2TranscriptionLanguageCodeMs  LiveV2TranscriptionLanguageCode = "ms"
	LiveV2TranscriptionLanguageCodeMt  LiveV2TranscriptionLanguageCode = "mt"
	LiveV2TranscriptionLanguageCodeMy  LiveV2TranscriptionLanguageCode = "my"
	LiveV2TranscriptionLanguageCodeNe  LiveV2TranscriptionLanguageCode = "ne"
	LiveV2TranscriptionLanguageCodeNl  LiveV2TranscriptionLanguageCode = "nl"
	LiveV2TranscriptionLanguageCodeNn  LiveV2TranscriptionLanguageCode = "nn"
	LiveV2TranscriptionLanguageCodeNo  LiveV2TranscriptionLanguageCode = "no"
	LiveV2TranscriptionLanguageCodeOc  LiveV2TranscriptionLanguageCode = "oc"
	LiveV2TranscriptionLanguageCodePa  LiveV2TranscriptionLanguageCode = "pa"
	LiveV2TranscriptionLanguageCodePl  LiveV2TranscriptionLanguageCode = "pl"
	LiveV2TranscriptionLanguageCodePs  LiveV2TranscriptionLanguageCode = "ps"
	LiveV2TranscriptionLanguageCodePt  LiveV2TranscriptionLanguageCode = "pt"
	LiveV2TranscriptionLanguageCodeRo  LiveV2TranscriptionLanguageCode = "ro"
	LiveV2TranscriptionLanguageCodeRu  LiveV2TranscriptionLanguageCode = "ru"
	LiveV2TranscriptionLanguageCodeSa  LiveV2TranscriptionLanguageCode = "sa"
	LiveV2TranscriptionLanguageCodeSd  LiveV2TranscriptionLanguageCode = "sd"
	LiveV2TranscriptionLanguageCodeSi  LiveV2TranscriptionLanguageCode = "si"
	LiveV2TranscriptionLanguageCodeSk  LiveV2TranscriptionLanguageCode = "sk"
	LiveV2TranscriptionLanguageCodeSl  LiveV2TranscriptionLanguageCode = "sl"
	LiveV2TranscriptionLanguageCodeSn  LiveV2TranscriptionLanguageCode = "sn"
	LiveV2TranscriptionLanguageCodeSo  LiveV2TranscriptionLanguageCode = "so"
	LiveV2TranscriptionLanguageCodeSq  LiveV2TranscriptionLanguageCode = "sq"
	LiveV2TranscriptionLanguageCodeSr  LiveV2TranscriptionLanguageCode = "sr"
	LiveV2TranscriptionLanguageCodeSu  LiveV2TranscriptionLanguageCode = "su"
	LiveV2TranscriptionLanguageCodeSv  LiveV2TranscriptionLanguageCode = "sv"
	LiveV2TranscriptionLanguageCodeSw  LiveV2TranscriptionLanguageCode = "sw"
	LiveV2TranscriptionLanguageCodeTa  LiveV2TranscriptionLanguageCode = "ta"
	LiveV2TranscriptionLanguageCodeTe  LiveV2TranscriptionLanguageCode = "te"
	LiveV2TranscriptionLanguageCodeTg  LiveV2TranscriptionLanguageCode = "tg"
	LiveV2TranscriptionLanguageCodeTh  LiveV2TranscriptionLanguageCode = "th"
	LiveV2TranscriptionLanguageCodeTk  LiveV2TranscriptionLanguageCode = "tk"
	LiveV2TranscriptionLanguageCodeTl  LiveV2TranscriptionLanguageCode = "tl"
	LiveV2TranscriptionLanguageCodeTr  LiveV2TranscriptionLanguageCode = "tr"
	LiveV2TranscriptionLanguageCodeTt  LiveV2TranscriptionLanguageCode = "tt"
	LiveV2TranscriptionLanguageCodeUk  LiveV2TranscriptionLanguageCode = "uk"
	LiveV2TranscriptionLanguageCodeUr  LiveV2TranscriptionLanguageCode = "ur"
	LiveV2TranscriptionLanguageCodeUz  LiveV2TranscriptionLanguageCode = "uz"
	LiveV2TranscriptionLanguageCodeVi  LiveV2TranscriptionLanguageCode = "vi"
	LiveV2TranscriptionLanguageCodeYi  LiveV2TranscriptionLanguageCode = "yi"
	LiveV2TranscriptionLanguageCodeYo  LiveV2TranscriptionLanguageCode = "yo"
	LiveV2TranscriptionLanguageCodeZh  LiveV2TranscriptionLanguageCode = "zh"
)

type LiveV2LanguageConfig struct {
	// If one language is set, it will be used for the transcription. Otherwise, language will be auto-detected by the model.
	Languages []LiveV2TranscriptionLanguageCode `json:"languages,omitempty"`
	// If true, language will be auto-detected on each utterance. Otherwise, language will be auto-detected on first utterance and then used for the rest of the transcription. If one language is set, this option will be ignored.
	CodeSwitching *bool `json:"code_switching,omitempty"`
}

type LiveV2PreProcessingConfig struct {
	// If true, apply pre-processing to the audio stream to enhance the quality.
	AudioEnhancer *bool `json:"audio_enhancer,omitempty"`
	// Sensitivity configuration for Speech Threshold. A value close to 1 will apply stricter thresholds, making it less likely to detect background sounds as speech.
	SpeechThreshold *float64 `json:"speech_threshold,omitempty"`
}

type LiveV2CustomVocabularyEntry struct {
	// The text used to replace in the transcription.
	Value string `json:"value"`
	// The global intensity of the feature.
	Intensity *float64 `json:"intensity,omitempty"`
	// The pronunciations used in the transcription.
	Pronunciations []string `json:"pronunciations,omitempty"`
	// Specify the language in which it will be pronounced when sound comparison occurs. Default to transcription language.
	Language *LiveV2TranscriptionLanguageCode `json:"language,omitempty"`
}

type LiveV2CustomVocabularyConfig struct {
	// Specific vocabulary list to feed the transcription model with. Each item can be a string or an object with the following properties: value, intensity, pronunciations, language.
	Vocabulary []any `json:"vocabulary"`
	// Default intensity for the custom vocabulary
	DefaultIntensity *float64 `json:"default_intensity,omitempty"`
}

type LiveV2CustomSpellingConfig struct {
	// The list of spelling applied on the audio transcription
	SpellingDictionary map[string][]string `json:"spelling_dictionary"`
}

type LiveV2TranslationLanguageCode string

const (
	LiveV2TranslationLanguageCodeAf  LiveV2TranslationLanguageCode = "af"
	LiveV2TranslationLanguageCodeAm  LiveV2TranslationLanguageCode = "am"
	LiveV2TranslationLanguageCodeAr  LiveV2TranslationLanguageCode = "ar"
	LiveV2TranslationLanguageCodeAs  LiveV2TranslationLanguageCode = "as"
	LiveV2TranslationLanguageCodeAz  LiveV2TranslationLanguageCode = "az"
	LiveV2TranslationLanguageCodeBa  LiveV2TranslationLanguageCode = "ba"
	LiveV2TranslationLanguageCodeBe  LiveV2TranslationLanguageCode = "be"
	LiveV2TranslationLanguageCodeBg  LiveV2TranslationLanguageCode = "bg"
	LiveV2TranslationLanguageCodeBn  LiveV2TranslationLanguageCode = "bn"
	LiveV2TranslationLanguageCodeBo  LiveV2TranslationLanguageCode = "bo"
	LiveV2TranslationLanguageCodeBr  LiveV2TranslationLanguageCode = "br"
	LiveV2TranslationLanguageCodeBs  LiveV2TranslationLanguageCode = "bs"
	LiveV2TranslationLanguageCodeCa  LiveV2TranslationLanguageCode = "ca"
	LiveV2TranslationLanguageCodeCs  LiveV2TranslationLanguageCode = "cs"
	LiveV2TranslationLanguageCodeCy  LiveV2TranslationLanguageCode = "cy"
	LiveV2TranslationLanguageCodeDa  LiveV2TranslationLanguageCode = "da"
	LiveV2TranslationLanguageCodeDe  LiveV2TranslationLanguageCode = "de"
	LiveV2TranslationLanguageCodeEl  LiveV2TranslationLanguageCode = "el"
	LiveV2TranslationLanguageCodeEn  LiveV2TranslationLanguageCode = "en"
	LiveV2TranslationLanguageCodeEs  LiveV2TranslationLanguageCode = "es"
	LiveV2TranslationLanguageCodeEt  LiveV2TranslationLanguageCode = "et"
	LiveV2TranslationLanguageCodeEu  LiveV2TranslationLanguageCode = "eu"
	LiveV2TranslationLanguageCodeFa  LiveV2TranslationLanguageCode = "fa"
	LiveV2TranslationLanguageCodeFi  LiveV2TranslationLanguageCode = "fi"
	LiveV2TranslationLanguageCodeFo  LiveV2TranslationLanguageCode = "fo"
	LiveV2TranslationLanguageCodeFr  LiveV2TranslationLanguageCode = "fr"
	LiveV2TranslationLanguageCodeGl  LiveV2TranslationLanguageCode = "gl"
	LiveV2TranslationLanguageCodeGu  LiveV2TranslationLanguageCode = "gu"
	LiveV2TranslationLanguageCodeHa  LiveV2TranslationLanguageCode = "ha"
	LiveV2TranslationLanguageCodeHaw LiveV2TranslationLanguageCode = "haw"
	LiveV2TranslationLanguageCodeHe  LiveV2TranslationLanguageCode = "he"
	LiveV2TranslationLanguageCodeHi  LiveV2TranslationLanguageCode = "hi"
	LiveV2TranslationLanguageCodeHr  LiveV2TranslationLanguageCode = "hr"
	LiveV2TranslationLanguageCodeHt  LiveV2TranslationLanguageCode = "ht"
	LiveV2TranslationLanguageCodeHu  LiveV2TranslationLanguageCode = "hu"
	LiveV2TranslationLanguageCodeHy  LiveV2TranslationLanguageCode = "hy"
	LiveV2TranslationLanguageCodeId  LiveV2TranslationLanguageCode = "id"
	LiveV2TranslationLanguageCodeIs  LiveV2TranslationLanguageCode = "is"
	LiveV2TranslationLanguageCodeIt  LiveV2TranslationLanguageCode = "it"
	LiveV2TranslationLanguageCodeJa  LiveV2TranslationLanguageCode = "ja"
	LiveV2TranslationLanguageCodeJw  LiveV2TranslationLanguageCode = "jw"
	LiveV2TranslationLanguageCodeKa  LiveV2TranslationLanguageCode = "ka"
	LiveV2TranslationLanguageCodeKk  LiveV2TranslationLanguageCode = "kk"
	LiveV2TranslationLanguageCodeKm  LiveV2TranslationLanguageCode = "km"
	LiveV2TranslationLanguageCodeKn  LiveV2TranslationLanguageCode = "kn"
	LiveV2TranslationLanguageCodeKo  LiveV2TranslationLanguageCode = "ko"
	LiveV2TranslationLanguageCodeLa  LiveV2TranslationLanguageCode = "la"
	LiveV2TranslationLanguageCodeLb  LiveV2TranslationLanguageCode = "lb"
	LiveV2TranslationLanguageCodeLn  LiveV2TranslationLanguageCode = "ln"
	LiveV2TranslationLanguageCodeLo  LiveV2TranslationLanguageCode = "lo"
	LiveV2TranslationLanguageCodeLt  LiveV2TranslationLanguageCode = "lt"
	LiveV2TranslationLanguageCodeLv  LiveV2TranslationLanguageCode = "lv"
	LiveV2TranslationLanguageCodeMg  LiveV2TranslationLanguageCode = "mg"
	LiveV2TranslationLanguageCodeMi  LiveV2TranslationLanguageCode = "mi"
	LiveV2TranslationLanguageCodeMk  LiveV2TranslationLanguageCode = "mk"
	LiveV2TranslationLanguageCodeMl  LiveV2TranslationLanguageCode = "ml"
	LiveV2TranslationLanguageCodeMn  LiveV2TranslationLanguageCode = "mn"
	LiveV2TranslationLanguageCodeMr  LiveV2TranslationLanguageCode = "mr"
	LiveV2TranslationLanguageCodeMs  LiveV2TranslationLanguageCode = "ms"
	LiveV2TranslationLanguageCodeMt  LiveV2TranslationLanguageCode = "mt"
	LiveV2TranslationLanguageCodeMy  LiveV2TranslationLanguageCode = "my"
	LiveV2TranslationLanguageCodeNe  LiveV2TranslationLanguageCode = "ne"
	LiveV2TranslationLanguageCodeNl  LiveV2TranslationLanguageCode = "nl"
	LiveV2TranslationLanguageCodeNn  LiveV2TranslationLanguageCode = "nn"
	LiveV2TranslationLanguageCodeNo  LiveV2TranslationLanguageCode = "no"
	LiveV2TranslationLanguageCodeOc  LiveV2TranslationLanguageCode = "oc"
	LiveV2TranslationLanguageCodePa  LiveV2TranslationLanguageCode = "pa"
	LiveV2TranslationLanguageCodePl  LiveV2TranslationLanguageCode = "pl"
	LiveV2TranslationLanguageCodePs  LiveV2TranslationLanguageCode = "ps"
	LiveV2TranslationLanguageCodePt  LiveV2TranslationLanguageCode = "pt"
	LiveV2TranslationLanguageCodeRo  LiveV2TranslationLanguageCode = "ro"
	LiveV2TranslationLanguageCodeRu  LiveV2TranslationLanguageCode = "ru"
	LiveV2TranslationLanguageCodeSa  LiveV2TranslationLanguageCode = "sa"
	LiveV2TranslationLanguageCodeSd  LiveV2TranslationLanguageCode = "sd"
	LiveV2TranslationLanguageCodeSi  LiveV2TranslationLanguageCode = "si"
	LiveV2TranslationLanguageCodeSk  LiveV2TranslationLanguageCode = "sk"
	LiveV2TranslationLanguageCodeSl  LiveV2TranslationLanguageCode = "sl"
	LiveV2TranslationLanguageCodeSn  LiveV2TranslationLanguageCode = "sn"
	LiveV2TranslationLanguageCodeSo  LiveV2TranslationLanguageCode = "so"
	LiveV2TranslationLanguageCodeSq  LiveV2TranslationLanguageCode = "sq"
	LiveV2TranslationLanguageCodeSr  LiveV2TranslationLanguageCode = "sr"
	LiveV2TranslationLanguageCodeSu  LiveV2TranslationLanguageCode = "su"
	LiveV2TranslationLanguageCodeSv  LiveV2TranslationLanguageCode = "sv"
	LiveV2TranslationLanguageCodeSw  LiveV2TranslationLanguageCode = "sw"
	LiveV2TranslationLanguageCodeTa  LiveV2TranslationLanguageCode = "ta"
	LiveV2TranslationLanguageCodeTe  LiveV2TranslationLanguageCode = "te"
	LiveV2TranslationLanguageCodeTg  LiveV2TranslationLanguageCode = "tg"
	LiveV2TranslationLanguageCodeTh  LiveV2TranslationLanguageCode = "th"
	LiveV2TranslationLanguageCodeTk  LiveV2TranslationLanguageCode = "tk"
	LiveV2TranslationLanguageCodeTl  LiveV2TranslationLanguageCode = "tl"
	LiveV2TranslationLanguageCodeTr  LiveV2TranslationLanguageCode = "tr"
	LiveV2TranslationLanguageCodeTt  LiveV2TranslationLanguageCode = "tt"
	LiveV2TranslationLanguageCodeUk  LiveV2TranslationLanguageCode = "uk"
	LiveV2TranslationLanguageCodeUr  LiveV2TranslationLanguageCode = "ur"
	LiveV2TranslationLanguageCodeUz  LiveV2TranslationLanguageCode = "uz"
	LiveV2TranslationLanguageCodeVi  LiveV2TranslationLanguageCode = "vi"
	LiveV2TranslationLanguageCodeWo  LiveV2TranslationLanguageCode = "wo"
	LiveV2TranslationLanguageCodeYi  LiveV2TranslationLanguageCode = "yi"
	LiveV2TranslationLanguageCodeYo  LiveV2TranslationLanguageCode = "yo"
	LiveV2TranslationLanguageCodeZh  LiveV2TranslationLanguageCode = "zh"
)

type LiveV2TranslationModel string

const (
	LiveV2TranslationModelBase     LiveV2TranslationModel = "base"
	LiveV2TranslationModelBatch    LiveV2TranslationModel = "batch"
	LiveV2TranslationModelEnhanced LiveV2TranslationModel = "enhanced"
)

type LiveV2TranslationConfig struct {
	// Target language in `iso639-1` format you want the transcription translated to
	TargetLanguages []LiveV2TranslationLanguageCode `json:"target_languages"`
	// Model you want the translation model to use to translate
	Model *LiveV2TranslationModel `json:"model,omitempty"`
	// Align translated utterances with the original ones
	MatchOriginalUtterances *bool `json:"match_original_utterances,omitempty"`
	// Whether to apply lipsync to the translated transcription.
	Lipsync *bool `json:"lipsync,omitempty"`
	// Enables or disables context-aware translation features that allow the model to adapt translations based on provided context.
	ContextAdaptation *bool `json:"context_adaptation,omitempty"`
	// Context information to improve translation accuracy
	Context *string `json:"context,omitempty"`
	// Forces the translation to use informal language forms when available in the target language.
	Informal *bool `json:"informal,omitempty"`
}

type LiveV2RealtimeProcessingConfig struct {
	// If true, enable custom vocabulary for the transcription.
	CustomVocabulary *bool `json:"custom_vocabulary,omitempty"`
	// Custom vocabulary configuration, if `custom_vocabulary` is enabled
	CustomVocabularyConfig *LiveV2CustomVocabularyConfig `json:"custom_vocabulary_config,omitempty"`
	// If true, enable custom spelling for the transcription.
	CustomSpelling *bool `json:"custom_spelling,omitempty"`
	// Custom spelling configuration, if `custom_spelling` is enabled
	CustomSpellingConfig *LiveV2CustomSpellingConfig `json:"custom_spelling_config,omitempty"`
	// If true, enable translation for the transcription
	Translation *bool `json:"translation,omitempty"`
	// Translation configuration, if `translation` is enabled
	TranslationConfig *LiveV2TranslationConfig `json:"translation_config,omitempty"`
	// If true, enable named entity recognition for the transcription.
	NamedEntityRecognition *bool `json:"named_entity_recognition,omitempty"`
	// If true, enable sentiment analysis for the transcription.
	SentimentAnalysis *bool `json:"sentiment_analysis,omitempty"`
}

type LiveV2SummaryType string

const (
	LiveV2SummaryTypeGeneral      LiveV2SummaryType = "general"
	LiveV2SummaryTypeBulletPoints LiveV2SummaryType = "bullet_points"
	LiveV2SummaryTypeConcise      LiveV2SummaryType = "concise"
)

type LiveV2SummarizationConfig struct {
	// The type of summarization to apply
	Type_ *LiveV2SummaryType `json:"type,omitempty"`
}

type LiveV2PostProcessingConfig struct {
	// If true, generates summarization for the whole transcription.
	Summarization *bool `json:"summarization,omitempty"`
	// Summarization configuration, if `summarization` is enabled
	SummarizationConfig *LiveV2SummarizationConfig `json:"summarization_config,omitempty"`
}

type LiveV2MessagesConfig struct {
	// If true, partial transcript will be sent to websocket.
	ReceivePartialTranscripts *bool `json:"receive_partial_transcripts,omitempty"`
	// If true, final transcript will be sent to websocket.
	ReceiveFinalTranscripts *bool `json:"receive_final_transcripts,omitempty"`
	// If true, begin and end speech events will be sent to websocket.
	ReceiveSpeechEvents *bool `json:"receive_speech_events,omitempty"`
	// If true, pre-processing events will be sent to websocket.
	ReceivePreProcessingEvents *bool `json:"receive_pre_processing_events,omitempty"`
	// If true, realtime processing events will be sent to websocket.
	ReceiveRealtimeProcessingEvents *bool `json:"receive_realtime_processing_events,omitempty"`
	// If true, post-processing events will be sent to websocket.
	ReceivePostProcessingEvents *bool `json:"receive_post_processing_events,omitempty"`
	// If true, acknowledgments will be sent to websocket.
	ReceiveAcknowledgments *bool `json:"receive_acknowledgments,omitempty"`
	// If true, errors will be sent to websocket.
	ReceiveErrors *bool `json:"receive_errors,omitempty"`
	// If true, lifecycle events will be sent to websocket.
	ReceiveLifecycleEvents *bool `json:"receive_lifecycle_events,omitempty"`
}

type LiveV2CallbackConfig struct {
	// URL on which we will do a `POST` request with configured messages
	Url *string `json:"url,omitempty"`
	// If true, partial transcript will be sent to the defined callback.
	ReceivePartialTranscripts *bool `json:"receive_partial_transcripts,omitempty"`
	// If true, final transcript will be sent to the defined callback.
	ReceiveFinalTranscripts *bool `json:"receive_final_transcripts,omitempty"`
	// If true, begin and end speech events will be sent to the defined callback.
	ReceiveSpeechEvents *bool `json:"receive_speech_events,omitempty"`
	// If true, pre-processing events will be sent to the defined callback.
	ReceivePreProcessingEvents *bool `json:"receive_pre_processing_events,omitempty"`
	// If true, realtime processing events will be sent to the defined callback.
	ReceiveRealtimeProcessingEvents *bool `json:"receive_realtime_processing_events,omitempty"`
	// If true, post-processing events will be sent to the defined callback.
	ReceivePostProcessingEvents *bool `json:"receive_post_processing_events,omitempty"`
	// If true, acknowledgments will be sent to the defined callback.
	ReceiveAcknowledgments *bool `json:"receive_acknowledgments,omitempty"`
	// If true, errors will be sent to the defined callback.
	ReceiveErrors *bool `json:"receive_errors,omitempty"`
	// If true, lifecycle events will be sent to the defined callback.
	ReceiveLifecycleEvents *bool `json:"receive_lifecycle_events,omitempty"`
}

type LiveV2FileResponse struct {
	// The file id
	Id string `json:"id"`
	// The name of the uploaded file
	Filename *string `json:"filename"`
	// The link used to download the file if audio_url was used
	Source *string `json:"source"`
	// Duration of the audio file
	AudioDuration *float64 `json:"audio_duration"`
	// Number of channels in the audio file
	NumberOfChannels *int `json:"number_of_channels"`
}

type LiveV2RequestParamsResponse struct {
	// The encoding format of the audio stream. Supported formats:
	// - PCM: 8, 16, 24, and 32 bits
	// - A-law: 8 bits
	// - μ-law: 8 bits
	//
	// Note: No need to add WAV headers to raw audio as the API supports both formats.
	Encoding *LiveV2Encoding `json:"encoding,omitempty"`
	// The bit depth of the audio stream
	BitDepth *LiveV2BitDepth `json:"bit_depth,omitempty"`
	// The sample rate of the audio stream
	SampleRate *LiveV2SampleRate `json:"sample_rate,omitempty"`
	// The number of channels of the audio stream
	Channels *int `json:"channels,omitempty"`
	// The model used to process the audio. "solaria-1" is used by default.
	Model *LiveV2Model `json:"model,omitempty"`
	// The endpointing duration in seconds. Endpointing is the duration of silence which will cause an utterance to be considered as finished. Only whole milliseconds are supported: the value is rounded to the nearest millisecond (e.g. 0.3825 becomes 0.383)
	Endpointing *float64 `json:"endpointing,omitempty"`
	// The maximum duration in seconds without endpointing. If endpointing is not detected after this duration, current utterance will be considered as finished
	MaximumDurationWithoutEndpointing *float64 `json:"maximum_duration_without_endpointing,omitempty"`
	// Specify the language configuration
	LanguageConfig *LiveV2LanguageConfig `json:"language_config,omitempty"`
	// Specify the pre-processing configuration
	PreProcessing *LiveV2PreProcessingConfig `json:"pre_processing,omitempty"`
	// Specify the realtime processing configuration
	RealtimeProcessing *LiveV2RealtimeProcessingConfig `json:"realtime_processing,omitempty"`
	// Specify the post-processing configuration
	PostProcessing *LiveV2PostProcessingConfig `json:"post_processing,omitempty"`
	// Specify the websocket messages configuration
	MessagesConfig *LiveV2MessagesConfig `json:"messages_config,omitempty"`
	// If true, messages will be sent to configured url.
	Callback *bool `json:"callback,omitempty"`
	// Specify the callback configuration
	CallbackConfig *LiveV2CallbackConfig `json:"callback_config,omitempty"`
}

type LiveV2TranscriptionMetadata struct {
	// Duration of the transcribed audio file
	AudioDuration float64 `json:"audio_duration"`
	// Number of distinct channels in the transcribed audio file
	NumberOfDistinctChannels int `json:"number_of_distinct_channels"`
	// Billed duration in seconds (audio_duration * number_of_distinct_channels)
	BillingTime float64 `json:"billing_time"`
	// Duration of the transcription in seconds
	TranscriptionTime float64 `json:"transcription_time"`
}

type LiveV2AddonError struct {
	// Status code of the addon error
	StatusCode int `json:"status_code"`
	// Reason of the addon error
	Exception string `json:"exception"`
	// Detailed message of the addon error
	Message string `json:"message"`
}

type LiveV2Sentences struct {
	// The audio intelligence model succeeded to get a valid output
	Success bool `json:"success"`
	// The audio intelligence model returned an empty value
	IsEmpty bool `json:"is_empty"`
	// Time audio intelligence model took to complete the task
	ExecTime float64 `json:"exec_time"`
	// `null` if `success` is `true`. Contains the error details of the failed model
	Error *LiveV2AddonError `json:"error"`
	// If `sentences` has been enabled, transcription as sentences.
	Results []string `json:"results"`
}

type LiveV2SubtitlesFormat string

const (
	LiveV2SubtitlesFormatSrt LiveV2SubtitlesFormat = "srt"
	LiveV2SubtitlesFormatVtt LiveV2SubtitlesFormat = "vtt"
)

type LiveV2Subtitle struct {
	// Format of the current subtitle
	Format LiveV2SubtitlesFormat `json:"format"`
	// Transcription on the asked subtitle format
	Subtitles string `json:"subtitles"`
}

type LiveV2Word struct {
	// Spoken word
	Word string `json:"word"`
	// Start timestamps in seconds of the spoken word
	Start float64 `json:"start"`
	// End timestamps in seconds of the spoken word
	End float64 `json:"end"`
	// Confidence on the transcribed word (1 = 100% confident)
	Confidence float64 `json:"confidence"`
}

type LiveV2Utterance struct {
	// Start timestamp in seconds of this utterance
	Start float64 `json:"start"`
	// End timestamp in seconds of this utterance
	End float64 `json:"end"`
	// Confidence on the transcribed utterance (1 = 100% confident)
	Confidence float64 `json:"confidence"`
	// Audio channel of where this utterance has been transcribed from
	Channel int `json:"channel"`
	// If `diarization` enabled, speaker identification number
	Speaker *int `json:"speaker,omitempty"`
	// List of words of the utterance, split by timestamp
	Words []LiveV2Word `json:"words"`
	// Transcription for this utterance
	Text string `json:"text"`
	// Spoken language in this utterance
	Language LiveV2TranscriptionLanguageCode `json:"language"`
}

type LiveV2Transcription struct {
	// All transcription on text format without any other information
	FullTranscript string `json:"full_transcript"`
	// All the detected languages in the audio sorted from the most detected to the less detected
	Languages []LiveV2TranscriptionLanguageCode `json:"languages"`
	// If `sentences` has been enabled, sentences results
	Sentences []LiveV2Sentences `json:"sentences,omitempty"`
	// If `subtitles` has been enabled, subtitles results
	Subtitles []LiveV2Subtitle `json:"subtitles,omitempty"`
	// Transcribed speech utterances present in the audio
	Utterances []LiveV2Utterance `json:"utterances"`
}

type LiveV2TranslationResult struct {
	// Contains the error details of the failed addon
	Error *LiveV2AddonError `json:"error"`
	// All transcription on text format without any other information
	FullTranscript string `json:"full_transcript"`
	// All the detected languages in the audio sorted from the most detected to the less detected
	Languages []LiveV2TranslationLanguageCode `json:"languages"`
	// If `sentences` has been enabled, sentences results for this translation
	Sentences []LiveV2Sentences `json:"sentences,omitempty"`
	// If `subtitles` has been enabled, subtitles results for this translation
	Subtitles []LiveV2Subtitle `json:"subtitles,omitempty"`
	// Transcribed speech utterances present in the audio
	Utterances []LiveV2Utterance `json:"utterances"`
}

type LiveV2Translation struct {
	// The audio intelligence model succeeded to get a valid output
	Success bool `json:"success"`
	// The audio intelligence model returned an empty value
	IsEmpty bool `json:"is_empty"`
	// Time audio intelligence model took to complete the task
	ExecTime float64 `json:"exec_time"`
	// `null` if `success` is `true`. Contains the error details of the failed model
	Error *LiveV2AddonError `json:"error"`
	// List of translated transcriptions, one for each `target_languages`
	Results []LiveV2TranslationResult `json:"results"`
}

type LiveV2Summarization struct {
	// The audio intelligence model succeeded to get a valid output
	Success bool `json:"success"`
	// The audio intelligence model returned an empty value
	IsEmpty bool `json:"is_empty"`
	// Time audio intelligence model took to complete the task
	ExecTime float64 `json:"exec_time"`
	// `null` if `success` is `true`. Contains the error details of the failed model
	Error *LiveV2AddonError `json:"error"`
	// If `summarization` has been enabled, summary of the transcription
	Results *string `json:"results"`
}

type LiveV2NamedEntityRecognitionResult struct {
	EntityType string  `json:"entity_type"`
	Text       string  `json:"text"`
	Start      float64 `json:"start"`
	End        float64 `json:"end"`
}

type LiveV2NamedEntityRecognition struct {
	// The audio intelligence model succeeded to get a valid output
	Success bool `json:"success"`
	// The audio intelligence model returned an empty value
	IsEmpty bool `json:"is_empty"`
	// Time audio intelligence model took to complete the task
	ExecTime float64 `json:"exec_time"`
	// `null` if `success` is `true`. Contains the error details of the failed model
	Error *LiveV2AddonError `json:"error"`
	// If `named_entity_recognition` has been enabled, the detected entities.
	Results []LiveV2NamedEntityRecognitionResult `json:"results"`
}

type LiveV2SentimentAnalysis struct {
	// The audio intelligence model succeeded to get a valid output
	Success bool `json:"success"`
	// The audio intelligence model returned an empty value
	IsEmpty bool `json:"is_empty"`
	// Time audio intelligence model took to complete the task
	ExecTime float64 `json:"exec_time"`
	// `null` if `success` is `true`. Contains the error details of the failed model
	Error *LiveV2AddonError `json:"error"`
	// If `sentiment_analysis` has been enabled, Gladia will analyze the sentiments and emotions of the audio
	Results string `json:"results"`
}

type LiveV2TranscriptionResultWithMessages struct {
	// Metadata for the given transcription & audio file
	Metadata LiveV2TranscriptionMetadata `json:"metadata"`
	// Transcription of the audio speech
	Transcription *LiveV2Transcription `json:"transcription,omitempty"`
	// If `translation` has been enabled, translation of the audio speech transcription
	Translation *LiveV2Translation `json:"translation,omitempty"`
	// If `summarization` has been enabled, summarization of the audio speech transcription
	Summarization *LiveV2Summarization `json:"summarization,omitempty"`
	// If `named_entity_recognition` has been enabled, the detected entities
	NamedEntityRecognition *LiveV2NamedEntityRecognition `json:"named_entity_recognition,omitempty"`
	// If `sentiment_analysis` has been enabled, sentiment analysis of the audio speech transcription
	SentimentAnalysis *LiveV2SentimentAnalysis `json:"sentiment_analysis,omitempty"`
	// Real-Time messages sent by the server during the live transcription.
	// The API returns WebSocket message objects; OpenAPI types this as strings.
	Messages []json.RawMessage `json:"messages,omitempty"`
}

type LiveV2Error struct {
	// The error message
	Message string `json:"message"`
}

type LiveV2AudioChunkAckData struct {
	// Range in bytes length of the audio chunk (relative to the whole session)
	ByteRange []int `json:"byte_range"`
	// Range in seconds of the audio chunk (relative to the whole session)
	TimeRange []float64 `json:"time_range"`
}

type LiveV2EndRecordingMessageData struct {
	// Total audio duration in seconds
	RecordingDuration float64 `json:"recording_duration"`
}

type LiveV2TranslationData struct {
	// Id of the utterance used for this result
	UtteranceId string `json:"utterance_id"`
	// The transcribed utterance
	Utterance LiveV2Utterance `json:"utterance"`
	// The original language in `iso639-1` or `iso639-2` format depending on the language
	OriginalLanguage LiveV2TranscriptionLanguageCode `json:"original_language"`
	// The target language in `iso639-1` or `iso639-2` format depending on the language
	TargetLanguage LiveV2TranslationLanguageCode `json:"target_language"`
	// The translated utterance
	TranslatedUtterance LiveV2Utterance `json:"translated_utterance"`
}

type LiveV2NamedEntityRecognitionData struct {
	// Id of the utterance used for this result
	UtteranceId string `json:"utterance_id"`
	// The transcribed utterance
	Utterance LiveV2Utterance `json:"utterance"`
	// The NER results
	Results []LiveV2NamedEntityRecognitionResult `json:"results"`
}

type LiveV2TranscriptionResult struct {
	// Metadata for the given transcription & audio file
	Metadata LiveV2TranscriptionMetadata `json:"metadata"`
	// Transcription of the audio speech
	Transcription *LiveV2Transcription `json:"transcription,omitempty"`
	// If `translation` has been enabled, translation of the audio speech transcription
	Translation *LiveV2Translation `json:"translation,omitempty"`
	// If `summarization` has been enabled, summarization of the audio speech transcription
	Summarization *LiveV2Summarization `json:"summarization,omitempty"`
	// If `named_entity_recognition` has been enabled, the detected entities
	NamedEntityRecognition *LiveV2NamedEntityRecognition `json:"named_entity_recognition,omitempty"`
	// If `sentiment_analysis` has been enabled, sentiment analysis of the audio speech transcription
	SentimentAnalysis *LiveV2SentimentAnalysis `json:"sentiment_analysis,omitempty"`
}

type LiveV2PostSummarizationMessageData struct {
	// The summarization
	Results string `json:"results"`
}

type LiveV2SentimentAnalysisResult struct {
	Sentiment string  `json:"sentiment"`
	Emotion   string  `json:"emotion"`
	Text      string  `json:"text"`
	Start     float64 `json:"start"`
	End       float64 `json:"end"`
	Channel   float64 `json:"channel"`
}

type LiveV2SentimentAnalysisData struct {
	// Id of the utterance used for this result
	UtteranceId string `json:"utterance_id"`
	// The transcribed utterance
	Utterance LiveV2Utterance `json:"utterance"`
	// The sentiment analysis results
	Results []LiveV2SentimentAnalysisResult `json:"results"`
}

type LiveV2StopRecordingAckData struct {
	// Total audio duration in seconds
	RecordingDuration float64 `json:"recording_duration"`
	// Audio duration left to process in seconds
	RecordingLeftToProcess float64 `json:"recording_left_to_process"`
}

type LiveV2TranscriptMessageData struct {
	// Id of the utterance
	Id string `json:"id"`
	// Flag to indicate if the transcript is final or not
	IsFinal bool `json:"is_final"`
	// The transcribed utterance
	Utterance LiveV2Utterance `json:"utterance"`
}

type LiveV2SpeechMessageData struct {
	// Timestamp in seconds of the speech event
	Time float64 `json:"time"`
	// Channel of the speech event
	Channel float64 `json:"channel"`
}

type LiveV2EventPayload struct {
	// Id of the job
	Id string `json:"id"`
}

// Init Session Types
type LiveV2InitRequest struct {
	// The encoding format of the audio stream. Supported formats:
	// - PCM: 8, 16, 24, and 32 bits
	// - A-law: 8 bits
	// - μ-law: 8 bits
	//
	// Note: No need to add WAV headers to raw audio as the API supports both formats.
	Encoding *LiveV2Encoding `json:"encoding,omitempty"`
	// The bit depth of the audio stream
	BitDepth *LiveV2BitDepth `json:"bit_depth,omitempty"`
	// The sample rate of the audio stream
	SampleRate *LiveV2SampleRate `json:"sample_rate,omitempty"`
	// The number of channels of the audio stream
	Channels *int `json:"channels,omitempty"`
	// Custom metadata you can attach to this live transcription
	CustomMetadata map[string]any `json:"custom_metadata,omitempty"`
	// The model used to process the audio. "solaria-1" is used by default.
	Model *LiveV2Model `json:"model,omitempty"`
	// The endpointing duration in seconds. Endpointing is the duration of silence which will cause an utterance to be considered as finished. Only whole milliseconds are supported: the value is rounded to the nearest millisecond (e.g. 0.3825 becomes 0.383)
	Endpointing *float64 `json:"endpointing,omitempty"`
	// The maximum duration in seconds without endpointing. If endpointing is not detected after this duration, current utterance will be considered as finished
	MaximumDurationWithoutEndpointing *float64 `json:"maximum_duration_without_endpointing,omitempty"`
	// Specify the language configuration
	LanguageConfig *LiveV2LanguageConfig `json:"language_config,omitempty"`
	// Specify the pre-processing configuration
	PreProcessing *LiveV2PreProcessingConfig `json:"pre_processing,omitempty"`
	// Specify the realtime processing configuration
	RealtimeProcessing *LiveV2RealtimeProcessingConfig `json:"realtime_processing,omitempty"`
	// Specify the post-processing configuration
	PostProcessing *LiveV2PostProcessingConfig `json:"post_processing,omitempty"`
	// Specify the websocket messages configuration
	MessagesConfig *LiveV2MessagesConfig `json:"messages_config,omitempty"`
	// If true, messages will be sent to configured url.
	Callback *bool `json:"callback,omitempty"`
	// Specify the callback configuration
	CallbackConfig *LiveV2CallbackConfig `json:"callback_config,omitempty"`
}

type LiveV2InitResponse struct {
	// Id of the job
	Id string `json:"id"`
	// Creation date
	CreatedAt string `json:"created_at"`
	// The websocket url to connect to for sending audio data. The url will contain the temporary token to authenticate the session.
	Url string `json:"url"`
}

// Job Management Types
type LiveV2Response struct {
	// Id of the job
	Id string `json:"id"`
	// Debug id
	RequestId string `json:"request_id"`
	// API version
	Version int `json:"version"`
	// "queued": the job has been queued. "processing": the job is being processed. "done": the job has been processed and the result is available. "error": an error occurred during the job's processing.
	Status string `json:"status"`
	// Creation date
	CreatedAt string `json:"created_at"`
	// Completion date when status is "done" or "error"
	CompletedAt *string `json:"completed_at,omitempty"`
	// Custom metadata given in the initial request
	CustomMetadata map[string]any `json:"custom_metadata,omitempty"`
	// HTTP status code of the error if status is "error"
	ErrorCode *int `json:"error_code,omitempty"`
	// For debugging purposes, send data that could help to identify issues
	PostSessionMetadata map[string]any `json:"post_session_metadata,omitempty"`
	Kind                string         `json:"kind"`
	// The file data you uploaded. Can be null if status is "error"
	File *LiveV2FileResponse `json:"file,omitempty"`
	// Parameters used for this live transcription. Can be null if status is "error"
	RequestParams *LiveV2RequestParamsResponse `json:"request_params,omitempty"`
	// Live transcription's result when status is "done"
	Result *LiveV2TranscriptionResultWithMessages `json:"result,omitempty"`
}

type LiveV2ListResponse struct {
	// URL to fetch the first page
	First string `json:"first"`
	// URL to fetch the current page
	Current string `json:"current"`
	// URL to fetch the next page
	Next *string `json:"next"`
	// List of live transcriptions
	Items []LiveV2Response `json:"items"`
}

// Query parameters for listing live transcription jobs
type LiveV2ListParams struct {
	// The starting point for pagination. A value of 0 starts from the first item.
	Offset *int `json:"offset,omitempty"`
	// The maximum number of items to return. Useful for pagination and controlling data payload size.
	Limit *int `json:"limit,omitempty"`
	// Filter items relevant to a specific date in ISO format (YYYY-MM-DD).
	Date *string `json:"date,omitempty"`
	// Include items that occurred before the specified date in ISO format.
	BeforeDate *string `json:"before_date,omitempty"`
	// Filter for items after the specified date. Use with `before_date` for a range. Date in ISO format.
	AfterDate *string `json:"after_date,omitempty"`
	// Filter the list based on item status. Accepts multiple values from the predefined list.
	Status         []string       `json:"status,omitempty"`
	CustomMetadata map[string]any `json:"custom_metadata,omitempty"`
	// Absolute pagination URL (`next`, `first`, or `current` from a previous list response). When set, other filters are ignored.
	Url *string `json:"url,omitempty"`
}

// WebSocket Messages Types
type LiveV2AudioChunkAckMessage struct {
	// Id of the live session
	SessionId string `json:"session_id"`
	// Date of creation of the message. The date is formatted as an ISO 8601 string
	CreatedAt string `json:"created_at"`
	// Flag to indicate if the action was successfully acknowledged
	Acknowledged bool `json:"acknowledged"`
	// Error message if the action was not successfully acknowledged
	Error *LiveV2Error `json:"error"`
	Type_ string       `json:"type"`
	// The message data. "null" if the action was not successfully acknowledged
	Data *LiveV2AudioChunkAckData `json:"data"`
}

type LiveV2EndRecordingMessage struct {
	// Id of the live session
	SessionId string `json:"session_id"`
	// Date of creation of the message. The date is formatted as an ISO 8601 string
	CreatedAt string `json:"created_at"`
	Type_     string `json:"type"`
	// The message data
	Data LiveV2EndRecordingMessageData `json:"data"`
}

type LiveV2EndSessionMessage struct {
	// Id of the live session
	SessionId string `json:"session_id"`
	// Date of creation of the message. The date is formatted as an ISO 8601 string
	CreatedAt string `json:"created_at"`
	Type_     string `json:"type"`
}

type LiveV2TranslationMessage struct {
	// Id of the live session
	SessionId string `json:"session_id"`
	// Date of creation of the message. The date is formatted as an ISO 8601 string
	CreatedAt string `json:"created_at"`
	// Error message if the addon failed
	Error *LiveV2Error `json:"error"`
	Type_ string       `json:"type"`
	// The message data. "null" if the addon failed
	Data *LiveV2TranslationData `json:"data"`
}

type LiveV2NamedEntityRecognitionMessage struct {
	// Id of the live session
	SessionId string `json:"session_id"`
	// Date of creation of the message. The date is formatted as an ISO 8601 string
	CreatedAt string `json:"created_at"`
	// Error message if the addon failed
	Error *LiveV2Error `json:"error"`
	Type_ string       `json:"type"`
	// The message data. "null" if the addon failed
	Data *LiveV2NamedEntityRecognitionData `json:"data"`
}

type LiveV2PostFinalTranscriptMessage struct {
	// Id of the live session
	SessionId string `json:"session_id"`
	// Date of creation of the message. The date is formatted as an ISO 8601 string
	CreatedAt string `json:"created_at"`
	Type_     string `json:"type"`
	// The message data
	Data LiveV2TranscriptionResult `json:"data"`
}

type LiveV2PostSummarizationMessage struct {
	// Id of the live session
	SessionId string `json:"session_id"`
	// Date of creation of the message. The date is formatted as an ISO 8601 string
	CreatedAt string `json:"created_at"`
	// Error message if the addon failed
	Error *LiveV2Error `json:"error"`
	Type_ string       `json:"type"`
	// The message data. "null" if the addon failed
	Data *LiveV2PostSummarizationMessageData `json:"data"`
}

type LiveV2PostTranscriptMessage struct {
	// Id of the live session
	SessionId string `json:"session_id"`
	// Date of creation of the message. The date is formatted as an ISO 8601 string
	CreatedAt string `json:"created_at"`
	Type_     string `json:"type"`
	// The message data
	Data LiveV2Transcription `json:"data"`
}

type LiveV2SentimentAnalysisMessage struct {
	// Id of the live session
	SessionId string `json:"session_id"`
	// Date of creation of the message. The date is formatted as an ISO 8601 string
	CreatedAt string `json:"created_at"`
	// Error message if the addon failed
	Error *LiveV2Error `json:"error"`
	Type_ string       `json:"type"`
	// The message data. "null" if the addon failed
	Data *LiveV2SentimentAnalysisData `json:"data"`
}

type LiveV2StartRecordingMessage struct {
	// Id of the live session
	SessionId string `json:"session_id"`
	// Date of creation of the message. The date is formatted as an ISO 8601 string
	CreatedAt string `json:"created_at"`
	Type_     string `json:"type"`
}

type LiveV2StartSessionMessage struct {
	// Id of the live session
	SessionId string `json:"session_id"`
	// Date of creation of the message. The date is formatted as an ISO 8601 string
	CreatedAt string `json:"created_at"`
	Type_     string `json:"type"`
}

type LiveV2StopRecordingAckMessage struct {
	// Id of the live session
	SessionId string `json:"session_id"`
	// Date of creation of the message. The date is formatted as an ISO 8601 string
	CreatedAt string `json:"created_at"`
	// Flag to indicate if the action was successfully acknowledged
	Acknowledged bool `json:"acknowledged"`
	// Error message if the action was not successfully acknowledged
	Error *LiveV2Error `json:"error"`
	Type_ string       `json:"type"`
	// The message data. "null" if the action was not successfully acknowledged
	Data *LiveV2StopRecordingAckData `json:"data"`
}

type LiveV2TranscriptMessage struct {
	// Id of the live session
	SessionId string `json:"session_id"`
	// Date of creation of the message. The date is formatted as an ISO 8601 string
	CreatedAt string `json:"created_at"`
	Type_     string `json:"type"`
	// The message data
	Data LiveV2TranscriptMessageData `json:"data"`
}

type LiveV2SpeechStartMessage struct {
	// Id of the live session
	SessionId string `json:"session_id"`
	// Date of creation of the message. The date is formatted as an ISO 8601 string
	CreatedAt string `json:"created_at"`
	Type_     string `json:"type"`
	// The message data
	Data LiveV2SpeechMessageData `json:"data"`
}

type LiveV2SpeechEndMessage struct {
	// Id of the live session
	SessionId string `json:"session_id"`
	// Date of creation of the message. The date is formatted as an ISO 8601 string
	CreatedAt string `json:"created_at"`
	Type_     string `json:"type"`
	// The message data
	Data LiveV2SpeechMessageData `json:"data"`
}

// Union of all websocket messages
// Union members: LiveV2AudioChunkAckMessage, LiveV2EndRecordingMessage, LiveV2EndSessionMessage, LiveV2TranslationMessage, LiveV2NamedEntityRecognitionMessage, LiveV2PostFinalTranscriptMessage, LiveV2PostSummarizationMessage, LiveV2PostTranscriptMessage, LiveV2SentimentAnalysisMessage, LiveV2StartRecordingMessage, LiveV2StartSessionMessage, LiveV2StopRecordingAckMessage, LiveV2TranscriptMessage, LiveV2SpeechStartMessage, LiveV2SpeechEndMessage
type LiveV2WebSocketMessage any

// Callback Messages Types
type LiveV2CallbackAudioChunkAckMessage struct {
	// Id of the job
	Id    string `json:"id"`
	Event string `json:"event"`
	// The live message payload as sent to the WebSocket
	Payload LiveV2AudioChunkAckMessage `json:"payload"`
}

type LiveV2CallbackEndRecordingMessage struct {
	// Id of the job
	Id    string `json:"id"`
	Event string `json:"event"`
	// The live message payload as sent to the WebSocket
	Payload LiveV2EndRecordingMessage `json:"payload"`
}

type LiveV2CallbackEndSessionMessage struct {
	// Id of the job
	Id    string `json:"id"`
	Event string `json:"event"`
	// The live message payload as sent to the WebSocket
	Payload LiveV2EndSessionMessage `json:"payload"`
}

type LiveV2CallbackTranslationMessage struct {
	// Id of the job
	Id    string `json:"id"`
	Event string `json:"event"`
	// The live message payload as sent to the WebSocket
	Payload LiveV2TranslationMessage `json:"payload"`
}

type LiveV2CallbackNamedEntityRecognitionMessage struct {
	// Id of the job
	Id    string `json:"id"`
	Event string `json:"event"`
	// The live message payload as sent to the WebSocket
	Payload LiveV2NamedEntityRecognitionMessage `json:"payload"`
}

type LiveV2CallbackPostFinalTranscriptMessage struct {
	// Id of the job
	Id    string `json:"id"`
	Event string `json:"event"`
	// The live message payload as sent to the WebSocket
	Payload LiveV2PostFinalTranscriptMessage `json:"payload"`
}

type LiveV2CallbackPostSummarizationMessage struct {
	// Id of the job
	Id    string `json:"id"`
	Event string `json:"event"`
	// The live message payload as sent to the WebSocket
	Payload LiveV2PostSummarizationMessage `json:"payload"`
}

type LiveV2CallbackPostTranscriptMessage struct {
	// Id of the job
	Id    string `json:"id"`
	Event string `json:"event"`
	// The live message payload as sent to the WebSocket
	Payload LiveV2PostTranscriptMessage `json:"payload"`
}

type LiveV2CallbackSentimentAnalysisMessage struct {
	// Id of the job
	Id    string `json:"id"`
	Event string `json:"event"`
	// The live message payload as sent to the WebSocket
	Payload LiveV2SentimentAnalysisMessage `json:"payload"`
}

type LiveV2CallbackStartRecordingMessage struct {
	// Id of the job
	Id    string `json:"id"`
	Event string `json:"event"`
	// The live message payload as sent to the WebSocket
	Payload LiveV2StartRecordingMessage `json:"payload"`
}

type LiveV2CallbackStartSessionMessage struct {
	// Id of the job
	Id    string `json:"id"`
	Event string `json:"event"`
	// The live message payload as sent to the WebSocket
	Payload LiveV2StartSessionMessage `json:"payload"`
}

type LiveV2CallbackStopRecordingAckMessage struct {
	// Id of the job
	Id    string `json:"id"`
	Event string `json:"event"`
	// The live message payload as sent to the WebSocket
	Payload LiveV2StopRecordingAckMessage `json:"payload"`
}

type LiveV2CallbackTranscriptMessage struct {
	// Id of the job
	Id    string `json:"id"`
	Event string `json:"event"`
	// The live message payload as sent to the WebSocket
	Payload LiveV2TranscriptMessage `json:"payload"`
}

type LiveV2CallbackSpeechStartMessage struct {
	// Id of the job
	Id    string `json:"id"`
	Event string `json:"event"`
	// The live message payload as sent to the WebSocket
	Payload LiveV2SpeechStartMessage `json:"payload"`
}

type LiveV2CallbackSpeechEndMessage struct {
	// Id of the job
	Id    string `json:"id"`
	Event string `json:"event"`
	// The live message payload as sent to the WebSocket
	Payload LiveV2SpeechEndMessage `json:"payload"`
}

// Union of all callback messages
// Union members: LiveV2CallbackAudioChunkAckMessage, LiveV2CallbackEndRecordingMessage, LiveV2CallbackEndSessionMessage, LiveV2CallbackTranslationMessage, LiveV2CallbackNamedEntityRecognitionMessage, LiveV2CallbackPostFinalTranscriptMessage, LiveV2CallbackPostSummarizationMessage, LiveV2CallbackPostTranscriptMessage, LiveV2CallbackSentimentAnalysisMessage, LiveV2CallbackStartRecordingMessage, LiveV2CallbackStartSessionMessage, LiveV2CallbackStopRecordingAckMessage, LiveV2CallbackTranscriptMessage, LiveV2CallbackSpeechStartMessage, LiveV2CallbackSpeechEndMessage
type LiveV2CallbackMessage any

// Webhook Messages Types
type LiveV2WebhookStartSessionMessage struct {
	Event   string             `json:"event"`
	Payload LiveV2EventPayload `json:"payload"`
}

type LiveV2WebhookStartRecordingMessage struct {
	Event   string             `json:"event"`
	Payload LiveV2EventPayload `json:"payload"`
}

type LiveV2WebhookEndRecordingMessage struct {
	Event   string             `json:"event"`
	Payload LiveV2EventPayload `json:"payload"`
}

type LiveV2WebhookEndSessionMessage struct {
	Event   string             `json:"event"`
	Payload LiveV2EventPayload `json:"payload"`
}

// Union of all webhook messages
// Union members: LiveV2WebhookStartSessionMessage, LiveV2WebhookStartRecordingMessage, LiveV2WebhookEndRecordingMessage, LiveV2WebhookEndSessionMessage
type LiveV2WebhookMessage any
