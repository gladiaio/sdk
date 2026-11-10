/*
 * This file is auto-generated. Do not edit manually.
 * Generated from OpenAPI schema.
 */

package prerecorded

import "encoding/json"

// Shared Types Types
type PreRecordedV2AudioUploadMetadata struct {
	// Uploaded audio file ID
	Id string `json:"id"`
	// Uploaded audio filename
	Filename string `json:"filename"`
	// Uploaded audio source
	Source *string `json:"source,omitempty"`
	// Uploaded audio detected extension
	Extension string `json:"extension"`
	// Uploaded audio size
	Size int `json:"size"`
	// Uploaded audio duration
	AudioDuration float64 `json:"audio_duration"`
	// Uploaded audio channel numbers
	NumberOfChannels int `json:"number_of_channels"`
}

type PreRecordedV2TranscriptionLanguageCode string

const (
	PreRecordedV2TranscriptionLanguageCodeAf  PreRecordedV2TranscriptionLanguageCode = "af"
	PreRecordedV2TranscriptionLanguageCodeAm  PreRecordedV2TranscriptionLanguageCode = "am"
	PreRecordedV2TranscriptionLanguageCodeAr  PreRecordedV2TranscriptionLanguageCode = "ar"
	PreRecordedV2TranscriptionLanguageCodeAs  PreRecordedV2TranscriptionLanguageCode = "as"
	PreRecordedV2TranscriptionLanguageCodeAz  PreRecordedV2TranscriptionLanguageCode = "az"
	PreRecordedV2TranscriptionLanguageCodeBa  PreRecordedV2TranscriptionLanguageCode = "ba"
	PreRecordedV2TranscriptionLanguageCodeBe  PreRecordedV2TranscriptionLanguageCode = "be"
	PreRecordedV2TranscriptionLanguageCodeBg  PreRecordedV2TranscriptionLanguageCode = "bg"
	PreRecordedV2TranscriptionLanguageCodeBn  PreRecordedV2TranscriptionLanguageCode = "bn"
	PreRecordedV2TranscriptionLanguageCodeBo  PreRecordedV2TranscriptionLanguageCode = "bo"
	PreRecordedV2TranscriptionLanguageCodeBr  PreRecordedV2TranscriptionLanguageCode = "br"
	PreRecordedV2TranscriptionLanguageCodeBs  PreRecordedV2TranscriptionLanguageCode = "bs"
	PreRecordedV2TranscriptionLanguageCodeCa  PreRecordedV2TranscriptionLanguageCode = "ca"
	PreRecordedV2TranscriptionLanguageCodeCs  PreRecordedV2TranscriptionLanguageCode = "cs"
	PreRecordedV2TranscriptionLanguageCodeCy  PreRecordedV2TranscriptionLanguageCode = "cy"
	PreRecordedV2TranscriptionLanguageCodeDa  PreRecordedV2TranscriptionLanguageCode = "da"
	PreRecordedV2TranscriptionLanguageCodeDe  PreRecordedV2TranscriptionLanguageCode = "de"
	PreRecordedV2TranscriptionLanguageCodeEl  PreRecordedV2TranscriptionLanguageCode = "el"
	PreRecordedV2TranscriptionLanguageCodeEn  PreRecordedV2TranscriptionLanguageCode = "en"
	PreRecordedV2TranscriptionLanguageCodeEs  PreRecordedV2TranscriptionLanguageCode = "es"
	PreRecordedV2TranscriptionLanguageCodeEt  PreRecordedV2TranscriptionLanguageCode = "et"
	PreRecordedV2TranscriptionLanguageCodeEu  PreRecordedV2TranscriptionLanguageCode = "eu"
	PreRecordedV2TranscriptionLanguageCodeFa  PreRecordedV2TranscriptionLanguageCode = "fa"
	PreRecordedV2TranscriptionLanguageCodeFi  PreRecordedV2TranscriptionLanguageCode = "fi"
	PreRecordedV2TranscriptionLanguageCodeFo  PreRecordedV2TranscriptionLanguageCode = "fo"
	PreRecordedV2TranscriptionLanguageCodeFr  PreRecordedV2TranscriptionLanguageCode = "fr"
	PreRecordedV2TranscriptionLanguageCodeGl  PreRecordedV2TranscriptionLanguageCode = "gl"
	PreRecordedV2TranscriptionLanguageCodeGu  PreRecordedV2TranscriptionLanguageCode = "gu"
	PreRecordedV2TranscriptionLanguageCodeHa  PreRecordedV2TranscriptionLanguageCode = "ha"
	PreRecordedV2TranscriptionLanguageCodeHaw PreRecordedV2TranscriptionLanguageCode = "haw"
	PreRecordedV2TranscriptionLanguageCodeHe  PreRecordedV2TranscriptionLanguageCode = "he"
	PreRecordedV2TranscriptionLanguageCodeHi  PreRecordedV2TranscriptionLanguageCode = "hi"
	PreRecordedV2TranscriptionLanguageCodeHr  PreRecordedV2TranscriptionLanguageCode = "hr"
	PreRecordedV2TranscriptionLanguageCodeHt  PreRecordedV2TranscriptionLanguageCode = "ht"
	PreRecordedV2TranscriptionLanguageCodeHu  PreRecordedV2TranscriptionLanguageCode = "hu"
	PreRecordedV2TranscriptionLanguageCodeHy  PreRecordedV2TranscriptionLanguageCode = "hy"
	PreRecordedV2TranscriptionLanguageCodeId  PreRecordedV2TranscriptionLanguageCode = "id"
	PreRecordedV2TranscriptionLanguageCodeIs  PreRecordedV2TranscriptionLanguageCode = "is"
	PreRecordedV2TranscriptionLanguageCodeIt  PreRecordedV2TranscriptionLanguageCode = "it"
	PreRecordedV2TranscriptionLanguageCodeJa  PreRecordedV2TranscriptionLanguageCode = "ja"
	PreRecordedV2TranscriptionLanguageCodeJw  PreRecordedV2TranscriptionLanguageCode = "jw"
	PreRecordedV2TranscriptionLanguageCodeKa  PreRecordedV2TranscriptionLanguageCode = "ka"
	PreRecordedV2TranscriptionLanguageCodeKk  PreRecordedV2TranscriptionLanguageCode = "kk"
	PreRecordedV2TranscriptionLanguageCodeKm  PreRecordedV2TranscriptionLanguageCode = "km"
	PreRecordedV2TranscriptionLanguageCodeKn  PreRecordedV2TranscriptionLanguageCode = "kn"
	PreRecordedV2TranscriptionLanguageCodeKo  PreRecordedV2TranscriptionLanguageCode = "ko"
	PreRecordedV2TranscriptionLanguageCodeLa  PreRecordedV2TranscriptionLanguageCode = "la"
	PreRecordedV2TranscriptionLanguageCodeLb  PreRecordedV2TranscriptionLanguageCode = "lb"
	PreRecordedV2TranscriptionLanguageCodeLn  PreRecordedV2TranscriptionLanguageCode = "ln"
	PreRecordedV2TranscriptionLanguageCodeLo  PreRecordedV2TranscriptionLanguageCode = "lo"
	PreRecordedV2TranscriptionLanguageCodeLt  PreRecordedV2TranscriptionLanguageCode = "lt"
	PreRecordedV2TranscriptionLanguageCodeLv  PreRecordedV2TranscriptionLanguageCode = "lv"
	PreRecordedV2TranscriptionLanguageCodeMg  PreRecordedV2TranscriptionLanguageCode = "mg"
	PreRecordedV2TranscriptionLanguageCodeMi  PreRecordedV2TranscriptionLanguageCode = "mi"
	PreRecordedV2TranscriptionLanguageCodeMk  PreRecordedV2TranscriptionLanguageCode = "mk"
	PreRecordedV2TranscriptionLanguageCodeMl  PreRecordedV2TranscriptionLanguageCode = "ml"
	PreRecordedV2TranscriptionLanguageCodeMn  PreRecordedV2TranscriptionLanguageCode = "mn"
	PreRecordedV2TranscriptionLanguageCodeMr  PreRecordedV2TranscriptionLanguageCode = "mr"
	PreRecordedV2TranscriptionLanguageCodeMs  PreRecordedV2TranscriptionLanguageCode = "ms"
	PreRecordedV2TranscriptionLanguageCodeMt  PreRecordedV2TranscriptionLanguageCode = "mt"
	PreRecordedV2TranscriptionLanguageCodeMy  PreRecordedV2TranscriptionLanguageCode = "my"
	PreRecordedV2TranscriptionLanguageCodeNe  PreRecordedV2TranscriptionLanguageCode = "ne"
	PreRecordedV2TranscriptionLanguageCodeNl  PreRecordedV2TranscriptionLanguageCode = "nl"
	PreRecordedV2TranscriptionLanguageCodeNn  PreRecordedV2TranscriptionLanguageCode = "nn"
	PreRecordedV2TranscriptionLanguageCodeNo  PreRecordedV2TranscriptionLanguageCode = "no"
	PreRecordedV2TranscriptionLanguageCodeOc  PreRecordedV2TranscriptionLanguageCode = "oc"
	PreRecordedV2TranscriptionLanguageCodePa  PreRecordedV2TranscriptionLanguageCode = "pa"
	PreRecordedV2TranscriptionLanguageCodePl  PreRecordedV2TranscriptionLanguageCode = "pl"
	PreRecordedV2TranscriptionLanguageCodePs  PreRecordedV2TranscriptionLanguageCode = "ps"
	PreRecordedV2TranscriptionLanguageCodePt  PreRecordedV2TranscriptionLanguageCode = "pt"
	PreRecordedV2TranscriptionLanguageCodeRo  PreRecordedV2TranscriptionLanguageCode = "ro"
	PreRecordedV2TranscriptionLanguageCodeRu  PreRecordedV2TranscriptionLanguageCode = "ru"
	PreRecordedV2TranscriptionLanguageCodeSa  PreRecordedV2TranscriptionLanguageCode = "sa"
	PreRecordedV2TranscriptionLanguageCodeSd  PreRecordedV2TranscriptionLanguageCode = "sd"
	PreRecordedV2TranscriptionLanguageCodeSi  PreRecordedV2TranscriptionLanguageCode = "si"
	PreRecordedV2TranscriptionLanguageCodeSk  PreRecordedV2TranscriptionLanguageCode = "sk"
	PreRecordedV2TranscriptionLanguageCodeSl  PreRecordedV2TranscriptionLanguageCode = "sl"
	PreRecordedV2TranscriptionLanguageCodeSn  PreRecordedV2TranscriptionLanguageCode = "sn"
	PreRecordedV2TranscriptionLanguageCodeSo  PreRecordedV2TranscriptionLanguageCode = "so"
	PreRecordedV2TranscriptionLanguageCodeSq  PreRecordedV2TranscriptionLanguageCode = "sq"
	PreRecordedV2TranscriptionLanguageCodeSr  PreRecordedV2TranscriptionLanguageCode = "sr"
	PreRecordedV2TranscriptionLanguageCodeSu  PreRecordedV2TranscriptionLanguageCode = "su"
	PreRecordedV2TranscriptionLanguageCodeSv  PreRecordedV2TranscriptionLanguageCode = "sv"
	PreRecordedV2TranscriptionLanguageCodeSw  PreRecordedV2TranscriptionLanguageCode = "sw"
	PreRecordedV2TranscriptionLanguageCodeTa  PreRecordedV2TranscriptionLanguageCode = "ta"
	PreRecordedV2TranscriptionLanguageCodeTe  PreRecordedV2TranscriptionLanguageCode = "te"
	PreRecordedV2TranscriptionLanguageCodeTg  PreRecordedV2TranscriptionLanguageCode = "tg"
	PreRecordedV2TranscriptionLanguageCodeTh  PreRecordedV2TranscriptionLanguageCode = "th"
	PreRecordedV2TranscriptionLanguageCodeTk  PreRecordedV2TranscriptionLanguageCode = "tk"
	PreRecordedV2TranscriptionLanguageCodeTl  PreRecordedV2TranscriptionLanguageCode = "tl"
	PreRecordedV2TranscriptionLanguageCodeTr  PreRecordedV2TranscriptionLanguageCode = "tr"
	PreRecordedV2TranscriptionLanguageCodeTt  PreRecordedV2TranscriptionLanguageCode = "tt"
	PreRecordedV2TranscriptionLanguageCodeUk  PreRecordedV2TranscriptionLanguageCode = "uk"
	PreRecordedV2TranscriptionLanguageCodeUr  PreRecordedV2TranscriptionLanguageCode = "ur"
	PreRecordedV2TranscriptionLanguageCodeUz  PreRecordedV2TranscriptionLanguageCode = "uz"
	PreRecordedV2TranscriptionLanguageCodeVi  PreRecordedV2TranscriptionLanguageCode = "vi"
	PreRecordedV2TranscriptionLanguageCodeYi  PreRecordedV2TranscriptionLanguageCode = "yi"
	PreRecordedV2TranscriptionLanguageCodeYo  PreRecordedV2TranscriptionLanguageCode = "yo"
	PreRecordedV2TranscriptionLanguageCodeZh  PreRecordedV2TranscriptionLanguageCode = "zh"
)

type PreRecordedV2CustomVocabularyEntry struct {
	// The text used to replace in the transcription.
	Value string `json:"value"`
	// The global intensity of the feature.
	Intensity *float64 `json:"intensity,omitempty"`
	// The pronunciations used in the transcription.
	Pronunciations []string `json:"pronunciations,omitempty"`
	// Specify the language in which it will be pronounced when sound comparison occurs. Default to transcription language.
	Language *PreRecordedV2TranscriptionLanguageCode `json:"language,omitempty"`
}

type PreRecordedV2CustomVocabularyConfig struct {
	// Specific vocabulary list to feed the transcription model with. Each item can be a string or an object with the following properties: value, intensity, pronunciations, language.
	Vocabulary []any `json:"vocabulary"`
	// Default intensity for the custom vocabulary
	DefaultIntensity *float64 `json:"default_intensity,omitempty"`
}

type PreRecordedV2CallbackMethod string

const (
	PreRecordedV2CallbackMethodPost PreRecordedV2CallbackMethod = "POST"
	PreRecordedV2CallbackMethodPut  PreRecordedV2CallbackMethod = "PUT"
)

type PreRecordedV2CallbackConfig struct {
	// The URL to be called with the result of the transcription
	Url string `json:"url"`
	// The HTTP method to be used. Allowed values are `POST` or `PUT` (default: `POST`)
	Method *PreRecordedV2CallbackMethod `json:"method,omitempty"`
}

type PreRecordedV2SubtitlesFormat string

const (
	PreRecordedV2SubtitlesFormatSrt PreRecordedV2SubtitlesFormat = "srt"
	PreRecordedV2SubtitlesFormatVtt PreRecordedV2SubtitlesFormat = "vtt"
)

type PreRecordedV2SubtitlesStyle string

const (
	PreRecordedV2SubtitlesStyleDefault    PreRecordedV2SubtitlesStyle = "default"
	PreRecordedV2SubtitlesStyleCompliance PreRecordedV2SubtitlesStyle = "compliance"
)

type PreRecordedV2SubtitlesConfig struct {
	// Subtitles formats you want your transcription to be formatted to
	Formats []PreRecordedV2SubtitlesFormat `json:"formats,omitempty"`
	// Minimum duration of a subtitle in seconds
	MinimumDuration *float64 `json:"minimum_duration,omitempty"`
	// Maximum duration of a subtitle in seconds
	MaximumDuration *float64 `json:"maximum_duration,omitempty"`
	// Maximum number of characters per row in a subtitle
	MaximumCharactersPerRow *int `json:"maximum_characters_per_row,omitempty"`
	// Maximum number of rows per caption
	MaximumRowsPerCaption *int `json:"maximum_rows_per_caption,omitempty"`
	// Style of the subtitles. Compliance mode refers to : https://loc.gov/preservation/digital/formats//fdd/fdd000569.shtml#:~:text=SRT%20files%20are%20basic%20text,alongside%2C%20example%3A%20%22MyVideo123
	Style *PreRecordedV2SubtitlesStyle `json:"style,omitempty"`
}

type PreRecordedV2DiarizationConfig struct {
	// Exact number of speakers in the audio
	NumberOfSpeakers *int `json:"number_of_speakers,omitempty"`
	// Minimum number of speakers in the audio
	MinSpeakers *int `json:"min_speakers,omitempty"`
	// Maximum number of speakers in the audio
	MaxSpeakers *int `json:"max_speakers,omitempty"`
}

type PreRecordedV2TranslationLanguageCode string

const (
	PreRecordedV2TranslationLanguageCodeAf  PreRecordedV2TranslationLanguageCode = "af"
	PreRecordedV2TranslationLanguageCodeAm  PreRecordedV2TranslationLanguageCode = "am"
	PreRecordedV2TranslationLanguageCodeAr  PreRecordedV2TranslationLanguageCode = "ar"
	PreRecordedV2TranslationLanguageCodeAs  PreRecordedV2TranslationLanguageCode = "as"
	PreRecordedV2TranslationLanguageCodeAz  PreRecordedV2TranslationLanguageCode = "az"
	PreRecordedV2TranslationLanguageCodeBa  PreRecordedV2TranslationLanguageCode = "ba"
	PreRecordedV2TranslationLanguageCodeBe  PreRecordedV2TranslationLanguageCode = "be"
	PreRecordedV2TranslationLanguageCodeBg  PreRecordedV2TranslationLanguageCode = "bg"
	PreRecordedV2TranslationLanguageCodeBn  PreRecordedV2TranslationLanguageCode = "bn"
	PreRecordedV2TranslationLanguageCodeBo  PreRecordedV2TranslationLanguageCode = "bo"
	PreRecordedV2TranslationLanguageCodeBr  PreRecordedV2TranslationLanguageCode = "br"
	PreRecordedV2TranslationLanguageCodeBs  PreRecordedV2TranslationLanguageCode = "bs"
	PreRecordedV2TranslationLanguageCodeCa  PreRecordedV2TranslationLanguageCode = "ca"
	PreRecordedV2TranslationLanguageCodeCs  PreRecordedV2TranslationLanguageCode = "cs"
	PreRecordedV2TranslationLanguageCodeCy  PreRecordedV2TranslationLanguageCode = "cy"
	PreRecordedV2TranslationLanguageCodeDa  PreRecordedV2TranslationLanguageCode = "da"
	PreRecordedV2TranslationLanguageCodeDe  PreRecordedV2TranslationLanguageCode = "de"
	PreRecordedV2TranslationLanguageCodeEl  PreRecordedV2TranslationLanguageCode = "el"
	PreRecordedV2TranslationLanguageCodeEn  PreRecordedV2TranslationLanguageCode = "en"
	PreRecordedV2TranslationLanguageCodeEs  PreRecordedV2TranslationLanguageCode = "es"
	PreRecordedV2TranslationLanguageCodeEt  PreRecordedV2TranslationLanguageCode = "et"
	PreRecordedV2TranslationLanguageCodeEu  PreRecordedV2TranslationLanguageCode = "eu"
	PreRecordedV2TranslationLanguageCodeFa  PreRecordedV2TranslationLanguageCode = "fa"
	PreRecordedV2TranslationLanguageCodeFi  PreRecordedV2TranslationLanguageCode = "fi"
	PreRecordedV2TranslationLanguageCodeFo  PreRecordedV2TranslationLanguageCode = "fo"
	PreRecordedV2TranslationLanguageCodeFr  PreRecordedV2TranslationLanguageCode = "fr"
	PreRecordedV2TranslationLanguageCodeGl  PreRecordedV2TranslationLanguageCode = "gl"
	PreRecordedV2TranslationLanguageCodeGu  PreRecordedV2TranslationLanguageCode = "gu"
	PreRecordedV2TranslationLanguageCodeHa  PreRecordedV2TranslationLanguageCode = "ha"
	PreRecordedV2TranslationLanguageCodeHaw PreRecordedV2TranslationLanguageCode = "haw"
	PreRecordedV2TranslationLanguageCodeHe  PreRecordedV2TranslationLanguageCode = "he"
	PreRecordedV2TranslationLanguageCodeHi  PreRecordedV2TranslationLanguageCode = "hi"
	PreRecordedV2TranslationLanguageCodeHr  PreRecordedV2TranslationLanguageCode = "hr"
	PreRecordedV2TranslationLanguageCodeHt  PreRecordedV2TranslationLanguageCode = "ht"
	PreRecordedV2TranslationLanguageCodeHu  PreRecordedV2TranslationLanguageCode = "hu"
	PreRecordedV2TranslationLanguageCodeHy  PreRecordedV2TranslationLanguageCode = "hy"
	PreRecordedV2TranslationLanguageCodeId  PreRecordedV2TranslationLanguageCode = "id"
	PreRecordedV2TranslationLanguageCodeIs  PreRecordedV2TranslationLanguageCode = "is"
	PreRecordedV2TranslationLanguageCodeIt  PreRecordedV2TranslationLanguageCode = "it"
	PreRecordedV2TranslationLanguageCodeJa  PreRecordedV2TranslationLanguageCode = "ja"
	PreRecordedV2TranslationLanguageCodeJw  PreRecordedV2TranslationLanguageCode = "jw"
	PreRecordedV2TranslationLanguageCodeKa  PreRecordedV2TranslationLanguageCode = "ka"
	PreRecordedV2TranslationLanguageCodeKk  PreRecordedV2TranslationLanguageCode = "kk"
	PreRecordedV2TranslationLanguageCodeKm  PreRecordedV2TranslationLanguageCode = "km"
	PreRecordedV2TranslationLanguageCodeKn  PreRecordedV2TranslationLanguageCode = "kn"
	PreRecordedV2TranslationLanguageCodeKo  PreRecordedV2TranslationLanguageCode = "ko"
	PreRecordedV2TranslationLanguageCodeLa  PreRecordedV2TranslationLanguageCode = "la"
	PreRecordedV2TranslationLanguageCodeLb  PreRecordedV2TranslationLanguageCode = "lb"
	PreRecordedV2TranslationLanguageCodeLn  PreRecordedV2TranslationLanguageCode = "ln"
	PreRecordedV2TranslationLanguageCodeLo  PreRecordedV2TranslationLanguageCode = "lo"
	PreRecordedV2TranslationLanguageCodeLt  PreRecordedV2TranslationLanguageCode = "lt"
	PreRecordedV2TranslationLanguageCodeLv  PreRecordedV2TranslationLanguageCode = "lv"
	PreRecordedV2TranslationLanguageCodeMg  PreRecordedV2TranslationLanguageCode = "mg"
	PreRecordedV2TranslationLanguageCodeMi  PreRecordedV2TranslationLanguageCode = "mi"
	PreRecordedV2TranslationLanguageCodeMk  PreRecordedV2TranslationLanguageCode = "mk"
	PreRecordedV2TranslationLanguageCodeMl  PreRecordedV2TranslationLanguageCode = "ml"
	PreRecordedV2TranslationLanguageCodeMn  PreRecordedV2TranslationLanguageCode = "mn"
	PreRecordedV2TranslationLanguageCodeMr  PreRecordedV2TranslationLanguageCode = "mr"
	PreRecordedV2TranslationLanguageCodeMs  PreRecordedV2TranslationLanguageCode = "ms"
	PreRecordedV2TranslationLanguageCodeMt  PreRecordedV2TranslationLanguageCode = "mt"
	PreRecordedV2TranslationLanguageCodeMy  PreRecordedV2TranslationLanguageCode = "my"
	PreRecordedV2TranslationLanguageCodeNe  PreRecordedV2TranslationLanguageCode = "ne"
	PreRecordedV2TranslationLanguageCodeNl  PreRecordedV2TranslationLanguageCode = "nl"
	PreRecordedV2TranslationLanguageCodeNn  PreRecordedV2TranslationLanguageCode = "nn"
	PreRecordedV2TranslationLanguageCodeNo  PreRecordedV2TranslationLanguageCode = "no"
	PreRecordedV2TranslationLanguageCodeOc  PreRecordedV2TranslationLanguageCode = "oc"
	PreRecordedV2TranslationLanguageCodePa  PreRecordedV2TranslationLanguageCode = "pa"
	PreRecordedV2TranslationLanguageCodePl  PreRecordedV2TranslationLanguageCode = "pl"
	PreRecordedV2TranslationLanguageCodePs  PreRecordedV2TranslationLanguageCode = "ps"
	PreRecordedV2TranslationLanguageCodePt  PreRecordedV2TranslationLanguageCode = "pt"
	PreRecordedV2TranslationLanguageCodeRo  PreRecordedV2TranslationLanguageCode = "ro"
	PreRecordedV2TranslationLanguageCodeRu  PreRecordedV2TranslationLanguageCode = "ru"
	PreRecordedV2TranslationLanguageCodeSa  PreRecordedV2TranslationLanguageCode = "sa"
	PreRecordedV2TranslationLanguageCodeSd  PreRecordedV2TranslationLanguageCode = "sd"
	PreRecordedV2TranslationLanguageCodeSi  PreRecordedV2TranslationLanguageCode = "si"
	PreRecordedV2TranslationLanguageCodeSk  PreRecordedV2TranslationLanguageCode = "sk"
	PreRecordedV2TranslationLanguageCodeSl  PreRecordedV2TranslationLanguageCode = "sl"
	PreRecordedV2TranslationLanguageCodeSn  PreRecordedV2TranslationLanguageCode = "sn"
	PreRecordedV2TranslationLanguageCodeSo  PreRecordedV2TranslationLanguageCode = "so"
	PreRecordedV2TranslationLanguageCodeSq  PreRecordedV2TranslationLanguageCode = "sq"
	PreRecordedV2TranslationLanguageCodeSr  PreRecordedV2TranslationLanguageCode = "sr"
	PreRecordedV2TranslationLanguageCodeSu  PreRecordedV2TranslationLanguageCode = "su"
	PreRecordedV2TranslationLanguageCodeSv  PreRecordedV2TranslationLanguageCode = "sv"
	PreRecordedV2TranslationLanguageCodeSw  PreRecordedV2TranslationLanguageCode = "sw"
	PreRecordedV2TranslationLanguageCodeTa  PreRecordedV2TranslationLanguageCode = "ta"
	PreRecordedV2TranslationLanguageCodeTe  PreRecordedV2TranslationLanguageCode = "te"
	PreRecordedV2TranslationLanguageCodeTg  PreRecordedV2TranslationLanguageCode = "tg"
	PreRecordedV2TranslationLanguageCodeTh  PreRecordedV2TranslationLanguageCode = "th"
	PreRecordedV2TranslationLanguageCodeTk  PreRecordedV2TranslationLanguageCode = "tk"
	PreRecordedV2TranslationLanguageCodeTl  PreRecordedV2TranslationLanguageCode = "tl"
	PreRecordedV2TranslationLanguageCodeTr  PreRecordedV2TranslationLanguageCode = "tr"
	PreRecordedV2TranslationLanguageCodeTt  PreRecordedV2TranslationLanguageCode = "tt"
	PreRecordedV2TranslationLanguageCodeUk  PreRecordedV2TranslationLanguageCode = "uk"
	PreRecordedV2TranslationLanguageCodeUr  PreRecordedV2TranslationLanguageCode = "ur"
	PreRecordedV2TranslationLanguageCodeUz  PreRecordedV2TranslationLanguageCode = "uz"
	PreRecordedV2TranslationLanguageCodeVi  PreRecordedV2TranslationLanguageCode = "vi"
	PreRecordedV2TranslationLanguageCodeWo  PreRecordedV2TranslationLanguageCode = "wo"
	PreRecordedV2TranslationLanguageCodeYi  PreRecordedV2TranslationLanguageCode = "yi"
	PreRecordedV2TranslationLanguageCodeYo  PreRecordedV2TranslationLanguageCode = "yo"
	PreRecordedV2TranslationLanguageCodeZh  PreRecordedV2TranslationLanguageCode = "zh"
)

type PreRecordedV2TranslationModel string

const (
	PreRecordedV2TranslationModelBase     PreRecordedV2TranslationModel = "base"
	PreRecordedV2TranslationModelBatch    PreRecordedV2TranslationModel = "batch"
	PreRecordedV2TranslationModelEnhanced PreRecordedV2TranslationModel = "enhanced"
)

type PreRecordedV2TranslationConfig struct {
	// Target language in `iso639-1` format you want the transcription translated to
	TargetLanguages []PreRecordedV2TranslationLanguageCode `json:"target_languages"`
	// Model you want the translation model to use to translate
	Model *PreRecordedV2TranslationModel `json:"model,omitempty"`
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

type PreRecordedV2SummaryType string

const (
	PreRecordedV2SummaryTypeGeneral      PreRecordedV2SummaryType = "general"
	PreRecordedV2SummaryTypeBulletPoints PreRecordedV2SummaryType = "bullet_points"
	PreRecordedV2SummaryTypeConcise      PreRecordedV2SummaryType = "concise"
)

type PreRecordedV2SummarizationConfig struct {
	// The type of summarization to apply
	Type_ *PreRecordedV2SummaryType `json:"type,omitempty"`
}

type PreRecordedV2CustomSpellingConfig struct {
	// The list of spelling applied on the audio transcription
	SpellingDictionary map[string][]string `json:"spelling_dictionary"`
}

type PreRecordedV2AudioToLlmListConfig struct {
	// The list of prompts applied on the audio transcription
	Prompts [][]any `json:"prompts"`
	// The model to use for the prompt execution. You can find the list of supported models [here](https://openrouter.ai/models).
	Model *string `json:"model,omitempty"`
}

type PreRecordedV2PiiRedactionEntityType string

const (
	PreRecordedV2PiiRedactionEntityTypeAppi                        PreRecordedV2PiiRedactionEntityType = "APPI"
	PreRecordedV2PiiRedactionEntityTypeAppiSensitive               PreRecordedV2PiiRedactionEntityType = "APPI_SENSITIVE"
	PreRecordedV2PiiRedactionEntityTypeCci                         PreRecordedV2PiiRedactionEntityType = "CCI"
	PreRecordedV2PiiRedactionEntityTypeCoreEntities                PreRecordedV2PiiRedactionEntityType = "CORE_ENTITIES"
	PreRecordedV2PiiRedactionEntityTypeCpra                        PreRecordedV2PiiRedactionEntityType = "CPRA"
	PreRecordedV2PiiRedactionEntityTypeGdpr                        PreRecordedV2PiiRedactionEntityType = "GDPR"
	PreRecordedV2PiiRedactionEntityTypeGdprSensitive               PreRecordedV2PiiRedactionEntityType = "GDPR_SENSITIVE"
	PreRecordedV2PiiRedactionEntityTypeHealthInformation           PreRecordedV2PiiRedactionEntityType = "HEALTH_INFORMATION"
	PreRecordedV2PiiRedactionEntityTypeHipaaSafeHarbor             PreRecordedV2PiiRedactionEntityType = "HIPAA_SAFE_HARBOR"
	PreRecordedV2PiiRedactionEntityTypeLidi                        PreRecordedV2PiiRedactionEntityType = "LIDI"
	PreRecordedV2PiiRedactionEntityTypeNumericalExclPci            PreRecordedV2PiiRedactionEntityType = "NUMERICAL_EXCL_PCI"
	PreRecordedV2PiiRedactionEntityTypePci                         PreRecordedV2PiiRedactionEntityType = "PCI"
	PreRecordedV2PiiRedactionEntityTypeQuebecPrivacyAct            PreRecordedV2PiiRedactionEntityType = "QUEBEC_PRIVACY_ACT"
	PreRecordedV2PiiRedactionEntityTypeAccountNumber               PreRecordedV2PiiRedactionEntityType = "ACCOUNT_NUMBER"
	PreRecordedV2PiiRedactionEntityTypeAge                         PreRecordedV2PiiRedactionEntityType = "AGE"
	PreRecordedV2PiiRedactionEntityTypeDate                        PreRecordedV2PiiRedactionEntityType = "DATE"
	PreRecordedV2PiiRedactionEntityTypeDateInterval                PreRecordedV2PiiRedactionEntityType = "DATE_INTERVAL"
	PreRecordedV2PiiRedactionEntityTypeDob                         PreRecordedV2PiiRedactionEntityType = "DOB"
	PreRecordedV2PiiRedactionEntityTypeDriverLicense               PreRecordedV2PiiRedactionEntityType = "DRIVER_LICENSE"
	PreRecordedV2PiiRedactionEntityTypeDuration                    PreRecordedV2PiiRedactionEntityType = "DURATION"
	PreRecordedV2PiiRedactionEntityTypeEmailAddress                PreRecordedV2PiiRedactionEntityType = "EMAIL_ADDRESS"
	PreRecordedV2PiiRedactionEntityTypeEvent                       PreRecordedV2PiiRedactionEntityType = "EVENT"
	PreRecordedV2PiiRedactionEntityTypeFilename                    PreRecordedV2PiiRedactionEntityType = "FILENAME"
	PreRecordedV2PiiRedactionEntityTypeGender                      PreRecordedV2PiiRedactionEntityType = "GENDER"
	PreRecordedV2PiiRedactionEntityTypeHealthcareNumber            PreRecordedV2PiiRedactionEntityType = "HEALTHCARE_NUMBER"
	PreRecordedV2PiiRedactionEntityTypeIpAddress                   PreRecordedV2PiiRedactionEntityType = "IP_ADDRESS"
	PreRecordedV2PiiRedactionEntityTypeLanguage                    PreRecordedV2PiiRedactionEntityType = "LANGUAGE"
	PreRecordedV2PiiRedactionEntityTypeLocation                    PreRecordedV2PiiRedactionEntityType = "LOCATION"
	PreRecordedV2PiiRedactionEntityTypeLocationAddress             PreRecordedV2PiiRedactionEntityType = "LOCATION_ADDRESS"
	PreRecordedV2PiiRedactionEntityTypeLocationAddressStreet       PreRecordedV2PiiRedactionEntityType = "LOCATION_ADDRESS_STREET"
	PreRecordedV2PiiRedactionEntityTypeLocationCity                PreRecordedV2PiiRedactionEntityType = "LOCATION_CITY"
	PreRecordedV2PiiRedactionEntityTypeLocationCoordinate          PreRecordedV2PiiRedactionEntityType = "LOCATION_COORDINATE"
	PreRecordedV2PiiRedactionEntityTypeLocationCountry             PreRecordedV2PiiRedactionEntityType = "LOCATION_COUNTRY"
	PreRecordedV2PiiRedactionEntityTypeLocationState               PreRecordedV2PiiRedactionEntityType = "LOCATION_STATE"
	PreRecordedV2PiiRedactionEntityTypeLocationZip                 PreRecordedV2PiiRedactionEntityType = "LOCATION_ZIP"
	PreRecordedV2PiiRedactionEntityTypeMaritalStatus               PreRecordedV2PiiRedactionEntityType = "MARITAL_STATUS"
	PreRecordedV2PiiRedactionEntityTypeMoney                       PreRecordedV2PiiRedactionEntityType = "MONEY"
	PreRecordedV2PiiRedactionEntityTypeName                        PreRecordedV2PiiRedactionEntityType = "NAME"
	PreRecordedV2PiiRedactionEntityTypeNameFamily                  PreRecordedV2PiiRedactionEntityType = "NAME_FAMILY"
	PreRecordedV2PiiRedactionEntityTypeNameGiven                   PreRecordedV2PiiRedactionEntityType = "NAME_GIVEN"
	PreRecordedV2PiiRedactionEntityTypeNameMedicalProfessional     PreRecordedV2PiiRedactionEntityType = "NAME_MEDICAL_PROFESSIONAL"
	PreRecordedV2PiiRedactionEntityTypeNumericalPii                PreRecordedV2PiiRedactionEntityType = "NUMERICAL_PII"
	PreRecordedV2PiiRedactionEntityTypeOccupation                  PreRecordedV2PiiRedactionEntityType = "OCCUPATION"
	PreRecordedV2PiiRedactionEntityTypeOrganization                PreRecordedV2PiiRedactionEntityType = "ORGANIZATION"
	PreRecordedV2PiiRedactionEntityTypeOrganizationMedicalFacility PreRecordedV2PiiRedactionEntityType = "ORGANIZATION_MEDICAL_FACILITY"
	PreRecordedV2PiiRedactionEntityTypeOrigin                      PreRecordedV2PiiRedactionEntityType = "ORIGIN"
	PreRecordedV2PiiRedactionEntityTypePassportNumber              PreRecordedV2PiiRedactionEntityType = "PASSPORT_NUMBER"
	PreRecordedV2PiiRedactionEntityTypePassword                    PreRecordedV2PiiRedactionEntityType = "PASSWORD"
	PreRecordedV2PiiRedactionEntityTypePhoneNumber                 PreRecordedV2PiiRedactionEntityType = "PHONE_NUMBER"
	PreRecordedV2PiiRedactionEntityTypePhysicalAttribute           PreRecordedV2PiiRedactionEntityType = "PHYSICAL_ATTRIBUTE"
	PreRecordedV2PiiRedactionEntityTypePoliticalAffiliation        PreRecordedV2PiiRedactionEntityType = "POLITICAL_AFFILIATION"
	PreRecordedV2PiiRedactionEntityTypeReligion                    PreRecordedV2PiiRedactionEntityType = "RELIGION"
	PreRecordedV2PiiRedactionEntityTypeSexuality                   PreRecordedV2PiiRedactionEntityType = "SEXUALITY"
	PreRecordedV2PiiRedactionEntityTypeSsn                         PreRecordedV2PiiRedactionEntityType = "SSN"
	PreRecordedV2PiiRedactionEntityTypeTime                        PreRecordedV2PiiRedactionEntityType = "TIME"
	PreRecordedV2PiiRedactionEntityTypeUrl                         PreRecordedV2PiiRedactionEntityType = "URL"
	PreRecordedV2PiiRedactionEntityTypeUsername                    PreRecordedV2PiiRedactionEntityType = "USERNAME"
	PreRecordedV2PiiRedactionEntityTypeVehicleId                   PreRecordedV2PiiRedactionEntityType = "VEHICLE_ID"
	PreRecordedV2PiiRedactionEntityTypeZodiacSign                  PreRecordedV2PiiRedactionEntityType = "ZODIAC_SIGN"
	PreRecordedV2PiiRedactionEntityTypeBloodType                   PreRecordedV2PiiRedactionEntityType = "BLOOD_TYPE"
	PreRecordedV2PiiRedactionEntityTypeCondition                   PreRecordedV2PiiRedactionEntityType = "CONDITION"
	PreRecordedV2PiiRedactionEntityTypeDose                        PreRecordedV2PiiRedactionEntityType = "DOSE"
	PreRecordedV2PiiRedactionEntityTypeDrug                        PreRecordedV2PiiRedactionEntityType = "DRUG"
	PreRecordedV2PiiRedactionEntityTypeInjury                      PreRecordedV2PiiRedactionEntityType = "INJURY"
	PreRecordedV2PiiRedactionEntityTypeMedicalProcess              PreRecordedV2PiiRedactionEntityType = "MEDICAL_PROCESS"
	PreRecordedV2PiiRedactionEntityTypeStatistics                  PreRecordedV2PiiRedactionEntityType = "STATISTICS"
	PreRecordedV2PiiRedactionEntityTypeBankAccount                 PreRecordedV2PiiRedactionEntityType = "BANK_ACCOUNT"
	PreRecordedV2PiiRedactionEntityTypeCreditCard                  PreRecordedV2PiiRedactionEntityType = "CREDIT_CARD"
	PreRecordedV2PiiRedactionEntityTypeCreditCardExpiration        PreRecordedV2PiiRedactionEntityType = "CREDIT_CARD_EXPIRATION"
	PreRecordedV2PiiRedactionEntityTypeCvv                         PreRecordedV2PiiRedactionEntityType = "CVV"
	PreRecordedV2PiiRedactionEntityTypeRoutingNumber               PreRecordedV2PiiRedactionEntityType = "ROUTING_NUMBER"
	PreRecordedV2PiiRedactionEntityTypeCorporateAction             PreRecordedV2PiiRedactionEntityType = "CORPORATE_ACTION"
	PreRecordedV2PiiRedactionEntityTypeDay                         PreRecordedV2PiiRedactionEntityType = "DAY"
	PreRecordedV2PiiRedactionEntityTypeEffect                      PreRecordedV2PiiRedactionEntityType = "EFFECT"
	PreRecordedV2PiiRedactionEntityTypeFinancialMetric             PreRecordedV2PiiRedactionEntityType = "FINANCIAL_METRIC"
	PreRecordedV2PiiRedactionEntityTypeMedicalCode                 PreRecordedV2PiiRedactionEntityType = "MEDICAL_CODE"
	PreRecordedV2PiiRedactionEntityTypeMonth                       PreRecordedV2PiiRedactionEntityType = "MONTH"
	PreRecordedV2PiiRedactionEntityTypeOrganizationId              PreRecordedV2PiiRedactionEntityType = "ORGANIZATION_ID"
	PreRecordedV2PiiRedactionEntityTypeProduct                     PreRecordedV2PiiRedactionEntityType = "PRODUCT"
	PreRecordedV2PiiRedactionEntityTypeProject                     PreRecordedV2PiiRedactionEntityType = "PROJECT"
	PreRecordedV2PiiRedactionEntityTypeTrend                       PreRecordedV2PiiRedactionEntityType = "TREND"
	PreRecordedV2PiiRedactionEntityTypeYear                        PreRecordedV2PiiRedactionEntityType = "YEAR"
)

type PreRecordedV2PiiRedactionConfig struct {
	// The presets and entity types to redact. When omitted or empty, the full default detection set is redacted. When non-empty, only the listed presets and entity types are redacted (not the default set plus these). Each preset covers different entity types: for instance `HEALTH_INFORMATION` only covers clinical content and does not redact names, contact details or SSN, which `HIPAA_SAFE_HARBOR` does. See https://docs.gladia.io/chapters/audio-intelligence/pii-redaction for the content of each preset.
	EntityTypes []PreRecordedV2PiiRedactionEntityType `json:"entity_types,omitempty"`
	// The type of processed text to return (marker or mask)
	ProcessedTextType *string `json:"processed_text_type,omitempty"`
}

type PreRecordedV2LanguageConfig struct {
	// If one language is set, it will be used for the transcription. Otherwise, language will be auto-detected by the model.
	Languages []PreRecordedV2TranscriptionLanguageCode `json:"languages,omitempty"`
	// If true, language will be auto-detected on each utterance. Otherwise, language will be auto-detected on first utterance and then used for the rest of the transcription. If one language is set, this option will be ignored.
	CodeSwitching *bool `json:"code_switching,omitempty"`
}

type PreRecordedV2TranscriptionModel string

const (
	PreRecordedV2TranscriptionModelSolaria1      PreRecordedV2TranscriptionModel = "solaria-1"
	PreRecordedV2TranscriptionModelSolaria3      PreRecordedV2TranscriptionModel = "solaria-3"
	PreRecordedV2TranscriptionModelSolariaFusion PreRecordedV2TranscriptionModel = "solaria-fusion"
)

type PreRecordedV2FileResponse struct {
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

type PreRecordedV2RequestParamsResponse struct {
	// **[Beta]** Can be either boolean to enable custom_vocabulary for this audio or an array with specific vocabulary list to feed the transcription model with
	CustomVocabulary *bool `json:"custom_vocabulary,omitempty"`
	// **[Beta]** Custom vocabulary configuration, if `custom_vocabulary` is enabled
	CustomVocabularyConfig *PreRecordedV2CustomVocabularyConfig `json:"custom_vocabulary_config,omitempty"`
	// **[Deprecated]** Use `callback`/`callback_config` instead. Callback URL we will do a `POST` request to with the result of the transcription
	CallbackUrl *string `json:"callback_url,omitempty"`
	// Enable callback for this transcription. If true, the `callback_config` property will be used to customize the callback behaviour
	Callback *bool `json:"callback,omitempty"`
	// Customize the callback behaviour (url and http method)
	CallbackConfig *PreRecordedV2CallbackConfig `json:"callback_config,omitempty"`
	// Enable subtitles generation for this transcription
	Subtitles *bool `json:"subtitles,omitempty"`
	// Configuration for subtitles generation if `subtitles` is enabled
	SubtitlesConfig *PreRecordedV2SubtitlesConfig `json:"subtitles_config,omitempty"`
	// Enable speaker recognition (diarization) for this audio
	Diarization *bool `json:"diarization,omitempty"`
	// Speaker recognition configuration, if `diarization` is enabled
	DiarizationConfig *PreRecordedV2DiarizationConfig `json:"diarization_config,omitempty"`
	// **[Beta]** Enable translation for this audio
	Translation *bool `json:"translation,omitempty"`
	// **[Beta]** Translation configuration, if `translation` is enabled
	TranslationConfig *PreRecordedV2TranslationConfig `json:"translation_config,omitempty"`
	// Enable summarization for this audio
	Summarization *bool `json:"summarization,omitempty"`
	// Summarization configuration, if `summarization` is enabled
	SummarizationConfig *PreRecordedV2SummarizationConfig `json:"summarization_config,omitempty"`
	// **[Alpha]** Enable named entity recognition for this audio
	NamedEntityRecognition *bool `json:"named_entity_recognition,omitempty"`
	// **[Alpha]** Enable custom spelling for this audio
	CustomSpelling *bool `json:"custom_spelling,omitempty"`
	// **[Alpha]** Custom spelling configuration, if `custom_spelling` is enabled
	CustomSpellingConfig *PreRecordedV2CustomSpellingConfig `json:"custom_spelling_config,omitempty"`
	// Enable sentiment analysis for this audio
	SentimentAnalysis *bool `json:"sentiment_analysis,omitempty"`
	// Enable audio to LLM processing for this audio
	AudioToLlm *bool `json:"audio_to_llm,omitempty"`
	// Audio to LLM configuration, if `audio_to_llm` is enabled
	AudioToLlmConfig *PreRecordedV2AudioToLlmListConfig `json:"audio_to_llm_config,omitempty"`
	// Enable PII redaction for this audio
	PiiRedaction *bool `json:"pii_redaction,omitempty"`
	// PII redaction configuration, if `pii_redaction` is enabled
	PiiRedactionConfig *PreRecordedV2PiiRedactionConfig `json:"pii_redaction_config,omitempty"`
	// Enable sentences for this audio
	Sentences *bool `json:"sentences,omitempty"`
	// **[Alpha]** Use enhanced punctuation for this audio
	PunctuationEnhanced *bool `json:"punctuation_enhanced,omitempty"`
	// Specify the language configuration
	LanguageConfig *PreRecordedV2LanguageConfig `json:"language_config,omitempty"`
	// The model used to process the audio. "solaria-1" is used by default.
	Model    *PreRecordedV2TranscriptionModel `json:"model,omitempty"`
	AudioUrl *string                          `json:"audio_url"`
}

type PreRecordedV2TranscriptionMetadata struct {
	// Duration of the transcribed audio file
	AudioDuration float64 `json:"audio_duration"`
	// Number of distinct channels in the transcribed audio file
	NumberOfDistinctChannels int `json:"number_of_distinct_channels"`
	// Billed duration in seconds (audio_duration * number_of_distinct_channels)
	BillingTime float64 `json:"billing_time"`
	// Duration of the transcription in seconds
	TranscriptionTime float64 `json:"transcription_time"`
}

type PreRecordedV2AddonError struct {
	// Status code of the addon error
	StatusCode int `json:"status_code"`
	// Reason of the addon error
	Exception string `json:"exception"`
	// Detailed message of the addon error
	Message string `json:"message"`
}

type PreRecordedV2Sentences struct {
	// The audio intelligence model succeeded to get a valid output
	Success bool `json:"success"`
	// The audio intelligence model returned an empty value
	IsEmpty bool `json:"is_empty"`
	// Time audio intelligence model took to complete the task
	ExecTime float64 `json:"exec_time"`
	// `null` if `success` is `true`. Contains the error details of the failed model
	Error *PreRecordedV2AddonError `json:"error"`
	// If `sentences` has been enabled, transcription as sentences.
	Results []string `json:"results"`
}

type PreRecordedV2Subtitle struct {
	// Format of the current subtitle
	Format PreRecordedV2SubtitlesFormat `json:"format"`
	// Transcription on the asked subtitle format
	Subtitles string `json:"subtitles"`
}

type PreRecordedV2Word struct {
	// Spoken word
	Word string `json:"word"`
	// Start timestamps in seconds of the spoken word
	Start float64 `json:"start"`
	// End timestamps in seconds of the spoken word
	End float64 `json:"end"`
	// Confidence on the transcribed word (1 = 100% confident)
	Confidence float64 `json:"confidence"`
}

type PreRecordedV2Utterance struct {
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
	Words []PreRecordedV2Word `json:"words"`
	// Transcription for this utterance
	Text string `json:"text"`
	// Spoken language in this utterance
	Language PreRecordedV2TranscriptionLanguageCode `json:"language"`
}

type PreRecordedV2Transcription struct {
	// All transcription on text format without any other information
	FullTranscript string `json:"full_transcript"`
	// All the detected languages in the audio sorted from the most detected to the less detected
	Languages []PreRecordedV2TranscriptionLanguageCode `json:"languages"`
	// If `sentences` has been enabled, sentences results
	Sentences []PreRecordedV2Sentences `json:"sentences,omitempty"`
	// If `subtitles` has been enabled, subtitles results
	Subtitles []PreRecordedV2Subtitle `json:"subtitles,omitempty"`
	// Transcribed speech utterances present in the audio
	Utterances []PreRecordedV2Utterance `json:"utterances"`
}

type PreRecordedV2TranslationResult struct {
	// Contains the error details of the failed addon
	Error *PreRecordedV2AddonError `json:"error"`
	// All transcription on text format without any other information
	FullTranscript string `json:"full_transcript"`
	// All the detected languages in the audio sorted from the most detected to the less detected
	Languages []PreRecordedV2TranslationLanguageCode `json:"languages"`
	// If `sentences` has been enabled, sentences results for this translation
	Sentences []PreRecordedV2Sentences `json:"sentences,omitempty"`
	// If `subtitles` has been enabled, subtitles results for this translation
	Subtitles []PreRecordedV2Subtitle `json:"subtitles,omitempty"`
	// Transcribed speech utterances present in the audio
	Utterances []PreRecordedV2Utterance `json:"utterances"`
}

type PreRecordedV2Translation struct {
	// The audio intelligence model succeeded to get a valid output
	Success bool `json:"success"`
	// The audio intelligence model returned an empty value
	IsEmpty bool `json:"is_empty"`
	// Time audio intelligence model took to complete the task
	ExecTime float64 `json:"exec_time"`
	// `null` if `success` is `true`. Contains the error details of the failed model
	Error *PreRecordedV2AddonError `json:"error"`
	// List of translated transcriptions, one for each `target_languages`
	Results []PreRecordedV2TranslationResult `json:"results"`
}

type PreRecordedV2Summarization struct {
	// The audio intelligence model succeeded to get a valid output
	Success bool `json:"success"`
	// The audio intelligence model returned an empty value
	IsEmpty bool `json:"is_empty"`
	// Time audio intelligence model took to complete the task
	ExecTime float64 `json:"exec_time"`
	// `null` if `success` is `true`. Contains the error details of the failed model
	Error *PreRecordedV2AddonError `json:"error"`
	// If `summarization` has been enabled, summary of the transcription
	Results *string `json:"results"`
}

type PreRecordedV2NamedEntityRecognitionResult struct {
	EntityType string  `json:"entity_type"`
	Text       string  `json:"text"`
	Start      float64 `json:"start"`
	End        float64 `json:"end"`
}

type PreRecordedV2NamedEntityRecognition struct {
	// The audio intelligence model succeeded to get a valid output
	Success bool `json:"success"`
	// The audio intelligence model returned an empty value
	IsEmpty bool `json:"is_empty"`
	// Time audio intelligence model took to complete the task
	ExecTime float64 `json:"exec_time"`
	// `null` if `success` is `true`. Contains the error details of the failed model
	Error *PreRecordedV2AddonError `json:"error"`
	// If `named_entity_recognition` has been enabled, the detected entities.
	Results []PreRecordedV2NamedEntityRecognitionResult `json:"results"`
}

type PreRecordedV2NamesConsistency struct {
	// The audio intelligence model succeeded to get a valid output
	Success bool `json:"success"`
	// The audio intelligence model returned an empty value
	IsEmpty bool `json:"is_empty"`
	// Time audio intelligence model took to complete the task
	ExecTime float64 `json:"exec_time"`
	// `null` if `success` is `true`. Contains the error details of the failed model
	Error *PreRecordedV2AddonError `json:"error"`
	// Deprecated, If `name_consistency` has been enabled, Gladia will improve the consistency of the names across the transcription
	Results *string `json:"results"`
}

type PreRecordedV2SentimentAnalysis struct {
	// The audio intelligence model succeeded to get a valid output
	Success bool `json:"success"`
	// The audio intelligence model returned an empty value
	IsEmpty bool `json:"is_empty"`
	// Time audio intelligence model took to complete the task
	ExecTime float64 `json:"exec_time"`
	// `null` if `success` is `true`. Contains the error details of the failed model
	Error *PreRecordedV2AddonError `json:"error"`
	// If `sentiment_analysis` has been enabled, Gladia will analyze the sentiments and emotions of the audio
	Results json.RawMessage `json:"results"`
}

type PreRecordedV2AudioToLlmResult struct {
	// The prompt used
	Prompt *string `json:"prompt"`
	// The result of the AI analysis
	Response *string `json:"response"`
}

type PreRecordedV2AudioToLlm struct {
	// The audio intelligence model succeeded to get a valid output
	Success bool `json:"success"`
	// The audio intelligence model returned an empty value
	IsEmpty bool `json:"is_empty"`
	// Time audio intelligence model took to complete the task
	ExecTime float64 `json:"exec_time"`
	// `null` if `success` is `true`. Contains the error details of the failed model
	Error *PreRecordedV2AddonError `json:"error"`
	// The result from a specific prompt
	Results *PreRecordedV2AudioToLlmResult `json:"results"`
}

type PreRecordedV2AudioToLlmList struct {
	// The audio intelligence model succeeded to get a valid output
	Success bool `json:"success"`
	// The audio intelligence model returned an empty value
	IsEmpty bool `json:"is_empty"`
	// Time audio intelligence model took to complete the task
	ExecTime float64 `json:"exec_time"`
	// `null` if `success` is `true`. Contains the error details of the failed model
	Error *PreRecordedV2AddonError `json:"error"`
	// If `audio_to_llm` has been enabled, results of the AI custom analysis
	Results []PreRecordedV2AudioToLlm `json:"results"`
}

type PreRecordedV2DisplayMode struct {
	// The audio intelligence model succeeded to get a valid output
	Success bool `json:"success"`
	// The audio intelligence model returned an empty value
	IsEmpty bool `json:"is_empty"`
	// Time audio intelligence model took to complete the task
	ExecTime float64 `json:"exec_time"`
	// `null` if `success` is `true`. Contains the error details of the failed model
	Error *PreRecordedV2AddonError `json:"error"`
	// If `display_mode` has been enabled, proposes an alternative display output.
	Results []string `json:"results"`
}

type PreRecordedV2Diarization struct {
	// The audio intelligence model succeeded to get a valid output
	Success bool `json:"success"`
	// The audio intelligence model returned an empty value
	IsEmpty bool `json:"is_empty"`
	// Time audio intelligence model took to complete the task
	ExecTime float64 `json:"exec_time"`
	// `null` if `success` is `true`. Contains the error details of the failed model
	Error *PreRecordedV2AddonError `json:"error"`
	// [Deprecated] If `diarization` has been enabled, the diarization result will appear here
	Results []PreRecordedV2Utterance `json:"results"`
}

type PreRecordedV2TranscriptionResult struct {
	// Metadata for the given transcription & audio file
	Metadata PreRecordedV2TranscriptionMetadata `json:"metadata"`
	// Transcription of the audio speech
	Transcription *PreRecordedV2Transcription `json:"transcription,omitempty"`
	// If `translation` has been enabled, translation of the audio speech transcription
	Translation *PreRecordedV2Translation `json:"translation,omitempty"`
	// If `summarization` has been enabled, summarization of the audio speech transcription
	Summarization *PreRecordedV2Summarization `json:"summarization,omitempty"`
	// If `named_entity_recognition` has been enabled, the detected entities
	NamedEntityRecognition *PreRecordedV2NamedEntityRecognition `json:"named_entity_recognition,omitempty"`
	// If `name_consistency` has been enabled, Gladia will improve consistency of the names accross the transcription
	NameConsistency *PreRecordedV2NamesConsistency `json:"name_consistency,omitempty"`
	// If `sentiment_analysis` has been enabled, sentiment analysis of the audio speech transcription
	SentimentAnalysis *PreRecordedV2SentimentAnalysis `json:"sentiment_analysis,omitempty"`
	// If `audio_to_llm` has been enabled, audio to llm results of the audio speech transcription
	AudioToLlm *PreRecordedV2AudioToLlmList `json:"audio_to_llm,omitempty"`
	// If `sentences` has been enabled, sentences of the audio speech transcription. Deprecated: content will move to the `transcription` object.
	Sentences *PreRecordedV2Sentences `json:"sentences,omitempty"`
	// If `display_mode` has been enabled, the output will be reordered, creating new utterances when speakers overlapped
	DisplayMode *PreRecordedV2DisplayMode `json:"display_mode,omitempty"`
	// If `diarization` has been requested and an error has occurred, the result will appear here
	Diarization *PreRecordedV2Diarization `json:"diarization,omitempty"`
}

// Upload Types
// Upload request body
type PreRecordedV2UploadRequest struct {
	// The URL of the audio or video file to be uploaded.
	AudioUrl *string `json:"audio_url,omitempty"`
}

type PreRecordedV2AudioUploadResponse struct {
	// Uploaded audio file Gladia URL
	AudioUrl string `json:"audio_url"`
	// Uploaded audio file detected metadata
	AudioMetadata PreRecordedV2AudioUploadMetadata `json:"audio_metadata"`
}

// Init Session Types
type PreRecordedV2InitTranscriptionRequest struct {
	// **[Beta]** Can be either boolean to enable custom_vocabulary for this audio or an array with specific vocabulary list to feed the transcription model with
	CustomVocabulary *bool `json:"custom_vocabulary,omitempty"`
	// **[Beta]** Custom vocabulary configuration, if `custom_vocabulary` is enabled
	CustomVocabularyConfig *PreRecordedV2CustomVocabularyConfig `json:"custom_vocabulary_config,omitempty"`
	// **[Deprecated]** Use `callback`/`callback_config` instead. Callback URL we will do a `POST` request to with the result of the transcription
	CallbackUrl *string `json:"callback_url,omitempty"`
	// Enable callback for this transcription. If true, the `callback_config` property will be used to customize the callback behaviour
	Callback *bool `json:"callback,omitempty"`
	// Customize the callback behaviour (url and http method)
	CallbackConfig *PreRecordedV2CallbackConfig `json:"callback_config,omitempty"`
	// Enable subtitles generation for this transcription
	Subtitles *bool `json:"subtitles,omitempty"`
	// Configuration for subtitles generation if `subtitles` is enabled
	SubtitlesConfig *PreRecordedV2SubtitlesConfig `json:"subtitles_config,omitempty"`
	// Enable speaker recognition (diarization) for this audio
	Diarization *bool `json:"diarization,omitempty"`
	// Speaker recognition configuration, if `diarization` is enabled
	DiarizationConfig *PreRecordedV2DiarizationConfig `json:"diarization_config,omitempty"`
	// **[Beta]** Enable translation for this audio
	Translation *bool `json:"translation,omitempty"`
	// **[Beta]** Translation configuration, if `translation` is enabled
	TranslationConfig *PreRecordedV2TranslationConfig `json:"translation_config,omitempty"`
	// Enable summarization for this audio
	Summarization *bool `json:"summarization,omitempty"`
	// Summarization configuration, if `summarization` is enabled
	SummarizationConfig *PreRecordedV2SummarizationConfig `json:"summarization_config,omitempty"`
	// **[Alpha]** Enable named entity recognition for this audio
	NamedEntityRecognition *bool `json:"named_entity_recognition,omitempty"`
	// **[Alpha]** Enable custom spelling for this audio
	CustomSpelling *bool `json:"custom_spelling,omitempty"`
	// **[Alpha]** Custom spelling configuration, if `custom_spelling` is enabled
	CustomSpellingConfig *PreRecordedV2CustomSpellingConfig `json:"custom_spelling_config,omitempty"`
	// Enable sentiment analysis for this audio
	SentimentAnalysis *bool `json:"sentiment_analysis,omitempty"`
	// Enable audio to LLM processing for this audio
	AudioToLlm *bool `json:"audio_to_llm,omitempty"`
	// Audio to LLM configuration, if `audio_to_llm` is enabled
	AudioToLlmConfig *PreRecordedV2AudioToLlmListConfig `json:"audio_to_llm_config,omitempty"`
	// Enable PII redaction for this audio
	PiiRedaction *bool `json:"pii_redaction,omitempty"`
	// PII redaction configuration, if `pii_redaction` is enabled
	PiiRedactionConfig *PreRecordedV2PiiRedactionConfig `json:"pii_redaction_config,omitempty"`
	// Custom metadata you can attach to this transcription
	CustomMetadata map[string]any `json:"custom_metadata,omitempty"`
	// Enable sentences for this audio
	Sentences *bool `json:"sentences,omitempty"`
	// **[Alpha]** Use enhanced punctuation for this audio
	PunctuationEnhanced *bool `json:"punctuation_enhanced,omitempty"`
	// Specify the language configuration
	LanguageConfig *PreRecordedV2LanguageConfig `json:"language_config,omitempty"`
	// The model used to process the audio. "solaria-1" is used by default.
	Model *PreRecordedV2TranscriptionModel `json:"model,omitempty"`
	// URL to a Gladia file or to an external audio or video file
	AudioUrl string `json:"audio_url"`
}

type PreRecordedV2InitTranscriptionResponse struct {
	// Id of the job
	Id string `json:"id"`
	// Prebuilt URL with your transcription `id` to fetch the result
	ResultUrl string `json:"result_url"`
}

// Result Types
type PreRecordedV2Response struct {
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
	File *PreRecordedV2FileResponse `json:"file,omitempty"`
	// Parameters used for this pre-recorded transcription. Can be null if status is "error"
	RequestParams *PreRecordedV2RequestParamsResponse `json:"request_params,omitempty"`
	// Pre-recorded transcription's result when status is "done"
	Result *PreRecordedV2TranscriptionResult `json:"result,omitempty"`
}

// List Types
type PreRecordedV2ListResponse struct {
	// URL to fetch the first page
	First string `json:"first"`
	// URL to fetch the current page
	Current string `json:"current"`
	// URL to fetch the next page
	Next *string `json:"next"`
	// List of pre-recorded transcriptions
	Items []PreRecordedV2Response `json:"items"`
}

// Query parameters for listing pre-recorded transcription jobs
type PreRecordedV2ListParams struct {
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
