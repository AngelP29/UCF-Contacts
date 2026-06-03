<?php

	$inData = getRequestInfo();
    $conn = new mysqli("localhost", "TheBeast", "WeLoveCOP4331", "COP4331");

    if( $conn->connect_error )
	{
		returnWithError( $conn->connect_error );
	}
    else
    {
        $stmt = $conn->prepare("UPDATE CONTACTS SET FirstName=?, LastName=?, Phone=?, Email=? WHERE ContactID=? AND UserID=?");
        $stmt->bind_param("ssssii", $inData["firstName"], $inData["lastName"], $inData["phone"], $inData["email"], $inData["contactId"], $inData["userId"]);
        $stmt->execute();
        if($stmt->affected_rows > 0)
        {
            returnWithInfo($inData["contactId"], $inData["firstName"], $inData["lastName"], $inData["phone"], $inData["email"]);
        }
        else
        {
            returnWithInfo(
                $inData["contactId"],
                $inData["firstName"],
                $inData["lastName"],
                $inData["phone"],
                $inData["email"]
            );
        }
        $stmt->close();
        $conn->close();

    }

    function getRequestInfo()
	{
		return json_decode(file_get_contents('php://input'), true);
	}

    function sendResultInfoAsJson( $obj )
	{
		header('Content-type: application/json');
		echo $obj;
	}

    function returnWithError($err)
	{
		$retValue = '{"error":"' . $err . '"}';
		sendResultInfoAsJson($retValue);
	}

    function returnWithInfo($contactId, $firstName, $lastName, $phone, $email)
{
	$retValue = '{"contactId":' . $contactId . ',"firstName":"' . $firstName . '","lastName":"' . $lastName . '","phone":"' . $phone . '","email":"' . $email . '","message":"Contact updated","error":""}';
	sendResultInfoAsJson($retValue);
}

?>
