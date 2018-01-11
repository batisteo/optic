package com.opticdev.core

import com.opticdev.core.sourcegear.graph.model.{BaseModelNode, ModelNode}
import com.opticdev.parsers.{AstGraph, ParserBase}

package object sourcegear {

  val version = "0.1.0"

  case class FileParseResults(astGraph: AstGraph, modelNodes: Set[ModelNode], parser: ParserBase, fileContents: String)

}
